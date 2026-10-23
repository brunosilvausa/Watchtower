import { z } from 'zod';
export const monitorTypes = ['http', 'keyword', 'ping', 'port', 'heartbeat', 'ssl', 'domain', 'dns', 'api'] as const;
export const channelTypes = ['email', 'sms', 'voice', 'slack', 'teams', 'discord', 'telegram', 'whatsapp', 'pagerduty', 'opsgenie', 'webhook', 'push'] as const;
export const idSchema = z.uuid();
const name = z.string().trim().min(1).max(100);
const safeTarget = z.string().trim().min(1).max(2048).refine(value => !/[\u0000-\u001f]/.test(value), 'Invalid target');
export const monitorSchema = z.object({
    name, type: z.enum(monitorTypes), target: safeTarget, intervalSeconds: z.number().int().min(30).max(604800).default(300),
    config: z.object({ privateProbeId: z.string().regex(/^private-[0-9a-f-]{36}$/).optional(), timeoutMs: z.number().int().min(100).max(10000).optional(), port: z.number().int().min(1).max(65535).optional(), expectedStatus: z.number().int().min(100).max(599).optional(), keyword: z.string().max(1000).optional(), keywordAbsent: z.boolean().optional(), expiryWarningDays: z.number().int().min(0).max(365).optional(), dnsRecord: z.enum(['A', 'AAAA', 'MX', 'TXT']).optional(), expectedValue: z.string().max(1000).optional(), steps: z.array(z.object({ url: z.url(), method: z.enum(['GET', 'POST']).default('GET'), body: z.string().max(16384).optional(), headers: z.record(z.string(), z.string().max(4096)).optional(), contains: z.string().max(1000).optional(), extract: z.array(z.object({ name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/), path: z.string().max(200) })).max(10).optional(), expectedStatus: z.number().int().min(100).max(599).optional() })).max(5).optional(), heartbeatGraceSeconds: z.number().int().min(0).max(86400).optional(), regions: z.array(z.string().regex(/^[a-z0-9-]{1,30}$/)).min(1).max(6).optional() }).strict().default({}),
}).strict().superRefine((value, ctx) => {
    if (['http', 'keyword', 'ssl'].includes(value.type)) {
        try {
            const u = new URL(value.target);
            if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.hash)
                throw Error();
        }
        catch {
            ctx.addIssue({ code: 'custom', path: ['target'], message: 'Use a valid HTTP(S) URL without credentials or fragments' });
        }
    }
    if (value.type === 'keyword' && !value.config.keyword)
        ctx.addIssue({ code: 'custom', path: ['config', 'keyword'], message: 'Keyword required' });
    if (value.type === 'api' && !value.config.steps?.length)
        ctx.addIssue({ code: 'custom', path: ['config', 'steps'], message: 'At least one API step required' });
    if (value.type === 'port' && !value.config.port)
        ctx.addIssue({ code: 'custom', path: ['config', 'port'], message: 'Port required' });
});
export const maintenanceSchema = z.object({ name, monitorIds: z.array(idSchema).max(200).default([]), startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }), timezone: z.string().max(100).default('UTC').refine(value => { try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
    }
    catch {
        return false;
    } }, 'Invalid timezone'), recurrence: z.enum(['once', 'weekly']).default('once') }).strict().refine(v => Date.parse(v.endsAt) > Date.parse(v.startsAt) && Date.parse(v.endsAt) - Date.parse(v.startsAt) <= 7 * 86400000, 'Window must last between zero and seven days');
export const channelSchema = z.object({ name, type: z.enum(channelTypes), destination: z.string().trim().min(1).max(4096), credentials: z.record(z.string().max(100), z.string().max(10000)).default({}), enabled: z.boolean().default(true) }).strict();
export const invitationSchema = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), role: z.enum(['admin', 'editor', 'viewer']) }).strict();
export const statusPageSchema = z.object({ name, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80), published: z.boolean().default(false), monitorIds: z.array(idSchema).max(200).default([]), password: z.string().min(10).max(128).optional(), showResponseTime: z.boolean().default(true), hideBranding: z.boolean().default(false), customDomain: z.string().regex(/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i).max(253).optional() }).strict();
export const apiKeySchema = z.object({ name, scopes: z.array(z.enum(['read', 'write', 'maintenance'])).min(1).max(3), expiresAt: z.iso.datetime({ offset: true }).optional() }).strict();
export const webhookSchema = z.object({ url: z.url().max(2048).refine(v => new URL(v).protocol === 'https:'), events: z.array(z.enum(['alert', 'recovery', 'test'])).min(1), enabled: z.boolean().default(true) }).strict();
export const preferencesSchema = z.object({ language: z.enum(['pt', 'en']).default('pt'), timezone: z.string().max(100).default('UTC').refine(value => { try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
    }
    catch {
        return false;
    } }), dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'), jobTitle: z.string().max(100).default(''), incidentEmail: z.boolean().default(true), weeklyReport: z.boolean().default(false), expiryEmail: z.boolean().default(true), productEmail: z.boolean().default(false) }).strict();
export type MonitorInput = z.infer<typeof monitorSchema>;
export const plans = { free: { name: 'Free', price: 0, monitors: 10, minInterval: 300, seats: 1 }, solo: { name: 'Solo', price: 39, monitors: 50, minInterval: 60, seats: 1 }, team: { name: 'Team', price: 149, monitors: 200, minInterval: 30, seats: 10 }, enterprise: { name: 'Enterprise', price: null, monitors: 1000, minInterval: 30, seats: 100 } } as const;
export type PlanId = keyof typeof plans;
export function planLimits(value: string) { return plans[value as PlanId] ?? plans.free; }
export function csvCell(value: unknown): string { const text = String(value ?? ''); return '"' + (/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"'; }
export function toCsv(rows: Record<string, unknown>[]): string { const columns = Object.keys(rows[0] ?? {}); return [columns.map(csvCell).join(','), ...rows.map(row => columns.map(key => csvCell(row[key])).join(','))].join('\r\n'); }
