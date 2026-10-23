import type pg from 'pg';
import { AccessError, type Actor } from './product.js';
import { audit, found, validateMonitorIds, workspacePlan, type ProductRequest } from './product-common.js';
import { maintenanceSchema, channelSchema, apiKeySchema, webhookSchema, statusPageSchema, planLimits } from './product-validation.js';
import { encryptSecret, newToken, tokenHash, hashPagePassword } from './product-secrets.js';
const resources = { maintenance: 'maintenance_windows', channels: 'alert_channels', 'api-keys': 'api_keys', webhooks: 'webhooks', 'status-pages': 'status_pages' } as const;
function redact(row: Record<string, unknown>) { const safe = { ...row }; for (const key of ['encrypted_credentials', 'encrypted_secret', 'token_hash', 'password_hash'])
    delete safe[key]; return safe; }
export async function resourceRequest(client: pg.PoolClient, actor: Actor, workspaceId: string, request: ProductRequest): Promise<unknown> {
    const resource = request.path[0] as keyof typeof resources, table = resources[resource], id = request.path[1];
    if (!table)
        throw new AccessError(404, 'Resource not found');
    if (request.method === 'GET' && resource === 'status-pages' && id && request.path[2] === 'preview') {
        const page = found((await client.query('SELECT name,slug,config FROM status_pages WHERE workspace_id=$1 AND id=$2', [workspaceId, id])).rows[0]);
        const components = (await client.query("SELECT m.id,m.name,CASE WHEN m.paused THEN 'paused' ELSE m.state END AS state,r.duration_ms,r.observed_at FROM status_components c JOIN monitors m ON m.id=c.monitor_id AND m.workspace_id=c.workspace_id LEFT JOIN LATERAL(SELECT duration_ms,observed_at FROM check_results WHERE workspace_id=$1 AND monitor_id=m.id ORDER BY observed_at DESC LIMIT 1)r ON true WHERE c.workspace_id=$1 AND c.page_id=$2 AND m.archived_at IS NULL ORDER BY c.position", [workspaceId, id])).rows;
        const updates = (await client.query('SELECT title,body,created_at FROM status_updates WHERE workspace_id=$1 AND page_id=$2 ORDER BY created_at DESC LIMIT 30', [workspaceId, id])).rows;
        return { ...page, components, updates };
    }
    if (request.method === 'GET' && resource === 'status-pages')
        return (await client.query("SELECT p.*,coalesce((SELECT array_agg(monitor_id) FROM status_components c WHERE c.page_id=p.id),'{}'::uuid[]) AS monitor_ids FROM status_pages p WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 500", [workspaceId])).rows.map(redact);
    if (request.method === 'GET')
        return (await client.query(`SELECT * FROM ${table} WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 500`, [workspaceId])).rows.map(redact);
    if (id) {
        found((await client.query(`SELECT id FROM ${table} WHERE workspace_id=$1 AND id=$2 FOR UPDATE`, [workspaceId, id])).rows[0]);
        if (resource === 'status-pages' && request.method === 'PATCH' && request.body && typeof request.body === 'object' && Object.keys(request.body).length === 1 && 'published' in request.body && typeof request.body.published === 'boolean') {
            await client.query('UPDATE status_pages SET published=$3 WHERE workspace_id=$1 AND id=$2', [workspaceId, id, request.body.published]);
            await audit(client, actor, workspaceId, 'publish', 'status-page', id);
            return { id, published: request.body.published };
        }
        if (request.method === 'DELETE') {
            if (resource === 'api-keys')
                await client.query('UPDATE api_keys SET revoked_at=now() WHERE workspace_id=$1 AND id=$2', [workspaceId, id]);
            else if (resource === 'channels')
                await client.query('UPDATE alert_channels SET enabled=false WHERE workspace_id=$1 AND id=$2', [workspaceId, id]);
            else if (resource === 'status-pages')
                await client.query('UPDATE status_pages SET published=false WHERE workspace_id=$1 AND id=$2', [workspaceId, id]);
            else
                await client.query(`DELETE FROM ${table} WHERE workspace_id=$1 AND id=$2`, [workspaceId, id]);
            await audit(client, actor, workspaceId, 'remove', resource, id);
            return { id };
        }
        if (resource === 'channels' && request.path[2] === 'test') {
            const key = newToken('test_');
            const row = (await client.query("INSERT INTO notification_outbox(workspace_id,channel_id,event,payload,idempotency_key) VALUES($1,$2,'test',$3,$4) RETURNING id", [workspaceId, id, JSON.stringify({ subject: 'Watchtower test', message: 'Test notification requested by a workspace administrator.' }), key])).rows[0];
            return { id: row.id, state: 'queued' };
        }
    }
    let result: Record<string, unknown>;
    if (resource === 'maintenance') {
        const v = maintenanceSchema.parse(request.body);
        await validateMonitorIds(client, workspaceId, v.monitorIds);
        const values = [workspaceId, v.name, v.monitorIds, v.startsAt, v.endsAt, v.timezone, v.recurrence];
        result = (await client.query(id ? 'UPDATE maintenance_windows SET name=$2,monitor_ids=$3,starts_at=$4,ends_at=$5,timezone=$6,recurrence=$7 WHERE workspace_id=$1 AND id=$8 RETURNING *' : 'INSERT INTO maintenance_windows(workspace_id,name,monitor_ids,starts_at,ends_at,timezone,recurrence) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', id ? [...values, id] : values)).rows[0];
    }
    else if (resource === 'channels') {
        const v = channelSchema.parse(request.body), plan = await workspacePlan(client, workspaceId);
        if (plan === 'free' && !['email', 'telegram'].includes(v.type))
            throw new AccessError(409, 'This channel requires a paid plan');
        const sealed = Object.keys(v.credentials).length ? encryptSecret(v.credentials) : null;
        const values = [workspaceId, v.name, v.type, v.destination, sealed, v.enabled];
        result = (await client.query(id ? 'UPDATE alert_channels SET name=$2,type=$3,destination=$4,encrypted_credentials=coalesce($5,encrypted_credentials),enabled=$6 WHERE workspace_id=$1 AND id=$7 RETURNING *' : 'INSERT INTO alert_channels(workspace_id,name,type,destination,encrypted_credentials,enabled) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', id ? [...values, id] : values)).rows[0];
    }
    else if (resource === 'api-keys') {
        if (id)
            throw new AccessError(405, 'Revoke and create a new key');
        const v = apiKeySchema.parse(request.body), token = newToken('wt_live_');
        if (v.expiresAt && Date.parse(v.expiresAt) <= Date.now())
            throw new AccessError(400, 'Expiry must be in the future');
        result = (await client.query('INSERT INTO api_keys(workspace_id,name,token_hash,prefix,scopes,expires_at,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,prefix', [workspaceId, v.name, tokenHash(token), token.slice(0, 15), v.scopes, v.expiresAt ?? null, actor.userId])).rows[0];
        result.token = token;
    }
    else if (resource === 'webhooks') {
        const v = webhookSchema.parse(request.body), secret = newToken('whsec_');
        result = (await client.query(id ? 'UPDATE webhooks SET url=$2,events=$4,enabled=$5 WHERE workspace_id=$1 AND id=$6 RETURNING id' : 'INSERT INTO webhooks(workspace_id,url,encrypted_secret,events,enabled) VALUES($1,$2,$3,$4,$5) RETURNING id', id ? [workspaceId, v.url, encryptSecret({ secret }), v.events, v.enabled, id] : [workspaceId, v.url, encryptSecret({ secret }), v.events, v.enabled])).rows[0];
        if (!id)
            result.secret = secret;
    }
    else {
        const v = statusPageSchema.parse(request.body), plan = await workspacePlan(client, workspaceId);
        await validateMonitorIds(client, workspaceId, v.monitorIds);
        if (v.hideBranding && plan !== 'team' && plan !== 'enterprise')
            throw new AccessError(409, 'Removing branding requires Team');
        if (!id && plan === 'free' && (await client.query('SELECT id FROM status_pages WHERE workspace_id=$1', [workspaceId])).rowCount)
            throw new AccessError(409, 'Status page limit reached');
        const values = [workspaceId, v.name, v.slug, v.published, v.password ? await hashPagePassword(v.password) : null, JSON.stringify({ showResponseTime: v.showResponseTime, hideBranding: v.hideBranding }), v.customDomain ?? null];
        result = (await client.query(id ? 'UPDATE status_pages SET name=$2,slug=$3,published=$4,password_hash=coalesce($5,password_hash),config=$6,custom_domain=$7,domain_verified_at=CASE WHEN custom_domain IS DISTINCT FROM $7 THEN NULL ELSE domain_verified_at END WHERE workspace_id=$1 AND id=$8 RETURNING *' : 'INSERT INTO status_pages(workspace_id,name,slug,published,password_hash,config,custom_domain) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', id ? [...values, id] : values)).rows[0];
        await client.query('DELETE FROM status_components WHERE workspace_id=$1 AND page_id=$2', [workspaceId, result.id]);
        for (const [position, monitorId] of v.monitorIds.entries())
            await client.query('INSERT INTO status_components(workspace_id,page_id,monitor_id,position) VALUES($1,$2,$3,$4)', [workspaceId, result.id, monitorId, position]);
    }
    await audit(client, actor, workspaceId, id ? 'update' : 'create', resource, String(result.id));
    return redact(result);
}
export { planLimits };
