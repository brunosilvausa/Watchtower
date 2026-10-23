import { isDeepStrictEqual } from 'node:util';
import type pg from 'pg';
import { AccessError, type Actor } from './product.js';
import { audit, found, workspacePlan, type ProductRequest } from './product-common.js';
import { monitorSchema, planLimits } from './product-validation.js';
import { newToken, tokenHash, encryptSecret, decryptSecret } from './product-secrets.js';
function publicMonitor(row: Record<string, unknown>) { const safe = { ...row }; delete safe.heartbeat_hash; const config = { ...(safe.config as Record<string, unknown> ?? {}) }; if (config.encryptedSteps) {
    delete config.encryptedSteps;
    config.stepsProtected = true;
} safe.config = config; return safe; }
async function stopIncidentNotifications(client: pg.PoolClient, workspaceId: string, monitorId: string, reason: string) {
    const closed = await client.query("UPDATE incidents SET state='resolved',resolved_at=now(),resolution=$3 WHERE workspace_id=$1 AND monitor_id=$2 AND resolved_at IS NULL RETURNING id", [workspaceId, monitorId, reason]);
    for (const incident of closed.rows) {
        await client.query("INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES($1,$2,'resolved',$3)", [workspaceId, incident.id, `Monitoring stopped: ${reason}. This does not prove recovery.`]);
    }
    await client.query("UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE workspace_id=$1 AND incident_id IN(SELECT id FROM incidents WHERE workspace_id=$1 AND monitor_id=$2) AND state IN ('pending','retry')", [workspaceId, monitorId]);
}
export async function monitorRequest(client: pg.PoolClient, actor: Actor, workspaceId: string, request: ProductRequest): Promise<unknown> {
    const id = request.path[1];
    if (request.method === 'GET') {
        if (!id)
            return (await client.query('SELECT * FROM monitors WHERE workspace_id=$1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 500', [workspaceId])).rows.map(publicMonitor);
        const monitor = found((await client.query('SELECT * FROM monitors WHERE workspace_id=$1 AND id=$2', [workspaceId, id])).rows[0]);
        delete monitor.heartbeat_hash;
        const results = (await client.query('SELECT * FROM check_results WHERE workspace_id=$1 AND monitor_id=$2 ORDER BY observed_at DESC LIMIT 100', [workspaceId, id])).rows;
        const incidents = (await client.query('SELECT * FROM incidents WHERE workspace_id=$1 AND monitor_id=$2 ORDER BY opened_at DESC LIMIT 100', [workspaceId, id])).rows;
        return { monitor: publicMonitor(monitor), results, incidents };
    }
    let previous: Record<string, unknown> | undefined;
    if (id) {
        const existing = found((await client.query('SELECT * FROM monitors WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL FOR UPDATE', [workspaceId, id])).rows[0]);
        previous = existing;
        if (request.method === 'DELETE') {
            await client.query("UPDATE monitors SET archived_at=now(),paused=true,lease_token=NULL,lease_until=NULL,config_version=config_version+1 WHERE workspace_id=$1 AND id=$2", [workspaceId, id]);
            await stopIncidentNotifications(client, workspaceId, id, 'monitor_archived');
            await audit(client, actor, workspaceId, 'archive', 'monitor', id);
            return { id };
        }
        if (request.path[2] === 'check') {
            if (existing.paused)
                throw new AccessError(409, 'Resume this monitor first');
            const recent = await client.query("SELECT id FROM audit_events WHERE workspace_id=$1 AND resource_id=$2 AND action='check-now' AND created_at>now()-interval '60 seconds'", [workspaceId, id]);
            if (recent.rowCount)
                throw new AccessError(429, 'Wait one minute before requesting another check');
            await client.query('SELECT request_monitor_check($1)', [id]);
            await audit(client, actor, workspaceId, 'check-now', 'monitor', id);
            return { id, state: 'queued' };
        }
        const body = request.body as Record<string, unknown>;
        if (body && Object.keys(body).length === 1 && ['paused', 'active'].includes(String(body.status))) {
            const paused = body.status === 'paused';
            await client.query("UPDATE monitors SET paused=$3,state=CASE WHEN $3 THEN 'paused' ELSE 'unknown' END,config_version=config_version+1,lease_token=NULL,lease_until=NULL,failure_count=0,success_count=0,next_check_at=now() WHERE workspace_id=$1 AND id=$2", [workspaceId, id, paused]);
            if (paused) await stopIncidentNotifications(client, workspaceId, id, 'monitor_paused');
            await audit(client, actor, workspaceId, paused ? 'pause' : 'resume', 'monitor', id);
            return { id, paused };
        }
    }
    let payload = request.body;
    const body = payload as { type?: string; config?: Record<string, unknown> } | undefined;
    const storedConfig = previous?.config as Record<string, unknown> | undefined;
    if (body?.type === 'api' && previous?.type === 'api' && body.config?.steps === undefined && typeof storedConfig?.encryptedSteps === 'string') {
        payload = { ...body, config: { ...body.config, steps: JSON.parse(decryptSecret(storedConfig.encryptedSteps).steps ?? '[]') as unknown } };
    }
    const input = monitorSchema.parse(payload), limits = planLimits(await workspacePlan(client, workspaceId));
    if (input.intervalSeconds < limits.minInterval)
        throw new AccessError(409, `Minimum interval for this plan is ${limits.minInterval} seconds`);
    if (!id) {
        const count = await client.query('SELECT count(*)::int AS count FROM monitors WHERE workspace_id=$1 AND archived_at IS NULL', [workspaceId]);
        if (count.rows[0].count >= limits.monitors)
            throw new AccessError(409, 'Monitor limit reached');
    }
    if (input.config.privateProbeId) {
        const probe = await client.query("SELECT manage_private_probe($1,$2,'list','', '{}'::jsonb) AS data", [actor.userId, workspaceId]);
        if (!Array.isArray(probe.rows[0]?.data) || !probe.rows[0].data.some((p: {
            id: string;
            draining: boolean;
        }) => p.id === input.config.privateProbeId && !p.draining))
            throw new AccessError(400, 'Private probe is unavailable');
    }
    const config: Record<string, unknown> = { ...input.config, type: input.type, target: input.target, heartbeatIntervalSeconds: input.intervalSeconds };
    const oldConfig = { ...storedConfig };
    if (typeof oldConfig.encryptedSteps === 'string') {
        oldConfig.steps = JSON.parse(decryptSecret(oldConfig.encryptedSteps).steps ?? '[]') as unknown;
        delete oldConfig.encryptedSteps;
    }
    const configurationChanged = !previous || previous.type !== input.type || previous.target !== input.target || previous.interval_seconds !== input.intervalSeconds || !isDeepStrictEqual(config, oldConfig);
    if (id && !configurationChanged) {
        await client.query('UPDATE monitors SET name=$3,updated_at=now() WHERE workspace_id=$1 AND id=$2', [workspaceId, id, input.name]);
        await audit(client, actor, workspaceId, 'update', 'monitor', id);
        return { id };
    }
    if (input.type === 'api') {
        config.encryptedSteps = encryptSecret({ steps: JSON.stringify(input.config.steps) });
        delete config.steps;
    }
    if (id) {
        const token = input.type === 'heartbeat' && previous?.type !== 'heartbeat' ? newToken('wt_hb_') : undefined;
        const heartbeatHash = input.type === 'heartbeat' ? token ? tokenHash(token) : previous?.heartbeat_hash : null;
        await client.query("UPDATE monitors SET heartbeat_hash=$8,name=$3,type=$4,target=$5,config=$6,interval_seconds=$7,config_version=config_version+1,state=CASE WHEN paused THEN 'paused' ELSE 'unknown' END,failure_count=0,success_count=0,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE workspace_id=$1 AND id=$2", [workspaceId, id, input.name, input.type, input.target, JSON.stringify(config), input.intervalSeconds, heartbeatHash]);
        await stopIncidentNotifications(client, workspaceId, id, 'configuration_changed');
        await audit(client, actor, workspaceId, 'update', 'monitor', id);
        return { id, ...token ? { heartbeatToken: token } : {} };
    }
    const token = input.type === 'heartbeat' ? newToken('wt_hb_') : undefined;
    const row = (await client.query('INSERT INTO monitors(workspace_id,name,type,target,config,interval_seconds,heartbeat_hash) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id', [workspaceId, input.name, input.type, input.target, JSON.stringify(config), input.intervalSeconds, token ? tokenHash(token) : null])).rows[0];
    await audit(client, actor, workspaceId, 'create', 'monitor', row.id);
    return { ...row, ...token ? { heartbeatToken: token } : {} };
}
