import { parseMonitorCsv } from './product-csv.js';
import { z } from 'zod';
import { withWorkspace, AccessError, type Actor, type Permission } from './product.js';
import { monitorRequest } from './product-monitors.js';
import { incidentRequest } from './product-incidents.js';
import { resourceRequest } from './product-resources.js';
import { teamRequest } from './product-team.js';
import { billingRequest, checkoutRequest } from './product-billing.js';
import { dashboard } from './product-dashboard.js';
import { preferencesSchema, idSchema } from './product-validation.js';
import { audit, type ProductRequest, type ProductResponse } from './product-common.js';
export type { ProductRequest, ProductResponse } from './product-common.js';
export async function handleWorkspaceRequest(actor: Actor, workspaceId: string, request: ProductRequest): Promise<ProductResponse> {
    idSchema.parse(workspaceId);
    const resource = request.path[0] ?? 'dashboard';
    const permissions: Record<string, Permission> = { monitors: 'monitor:write', incidents: 'incident:write', maintenance: 'maintenance:write', billing: 'billing:write', settings: 'read', team: 'workspace:admin', invitations: 'workspace:admin', channels: 'workspace:admin', 'status-pages': 'workspace:admin', 'api-keys': 'workspace:admin', webhooks: 'workspace:admin', policies: 'workspace:admin' };
    const permission = request.method === 'GET' ? (resource === 'billing' ? 'billing:write' : 'read') : permissions[resource];
    if (!permission)
        throw new AccessError(404, 'Resource not found');
    if (request.path[1] && request.path[1] !== 'import' && !['settings', 'billing', 'team'].includes(resource))
        idSchema.parse(request.path[1]);
    if (resource === 'billing' && request.path[1] === 'checkout') {
        if (request.method !== 'POST') throw new AccessError(405, 'Checkout requires POST');
        return { status: 201, data: await checkoutRequest(actor, workspaceId, request.body) };
    }
    const data = await withWorkspace(actor, workspaceId, permission, async (client) => {
        if (resource === 'dashboard' && request.method === 'GET')
            return dashboard(client, workspaceId, actor.userId, request.range);
        if (resource === 'monitors' && request.path[1] === 'import' && request.method === 'POST') {
            const body = z.object({ csv: z.string().max(60000) }).parse(request.body);
            const rows = parseMonitorCsv(body.csv), created = [];
            for (const row of rows)
                created.push(await monitorRequest(client, actor, workspaceId, { method: 'POST', path: ['monitors'], body: row }));
            return created;
        }
        if (resource === 'monitors')
            return monitorRequest(client, actor, workspaceId, request);
        if (resource === 'incidents')
            return incidentRequest(client, actor, workspaceId, request);
        if (['maintenance', 'channels', 'status-pages', 'api-keys', 'webhooks'].includes(resource))
            return resourceRequest(client, actor, workspaceId, request);
        if (resource === 'team' || resource === 'invitations')
            return teamRequest(client, actor, workspaceId, request);
        if (resource === 'billing')
            return billingRequest(client, actor, workspaceId, request);
        if (resource === 'audit' && request.method === 'GET')
            return (await client.query("SELECT id,actor_id,action,resource_type,resource_id,created_at FROM audit_events WHERE workspace_id=$1 AND created_at>now()-interval '365 days' ORDER BY created_at DESC LIMIT 500", [workspaceId])).rows;
        if (resource === 'settings') {
            if (request.method === 'GET')
                return (await client.query('SELECT preferences FROM user_preferences WHERE user_id=$1', [actor.userId])).rows[0]?.preferences ?? preferencesSchema.parse({});
            const input = preferencesSchema.parse(request.body);
            await client.query('INSERT INTO user_preferences(user_id,preferences) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET preferences=EXCLUDED.preferences', [actor.userId, JSON.stringify(input)]);
            await audit(client, actor, workspaceId, 'preferences', 'user', actor.userId);
            return input;
        }
        if (resource === 'policies') {
            if (request.method === 'GET')
                return (await client.query('SELECT * FROM alert_policies WHERE workspace_id=$1', [workspaceId])).rows;
            const input = z.object({ name: z.string().min(1).max(100), config: z.object({ recovery: z.boolean(), reminders: z.boolean(), quiet: z.enum(['never', 'night', 'weekend']), timezone: z.string().max(100), quorum: z.number().int().min(1).max(6), escalation: z.boolean() }).strict() }).strict().parse(request.body);
            await client.query('DELETE FROM alert_policies WHERE workspace_id=$1', [workspaceId]);
            return (await client.query('INSERT INTO alert_policies(workspace_id,name,config) VALUES($1,$2,$3) RETURNING *', [workspaceId, input.name, JSON.stringify(input.config)])).rows[0];
        }
        throw new AccessError(404, 'Resource not found');
    });
    return { status: request.method === 'POST' ? 201 : 200, data };
}
export async function getWorkspaceDashboard(actor: Actor, workspaceId: string, range: '24h' | '7d' | '30d') { return withWorkspace(actor, workspaceId, 'read', client => dashboard(client, workspaceId, actor.userId, range)); }
