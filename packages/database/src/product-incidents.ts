import type pg from 'pg';
import { AccessError, type Actor } from './product.js';
import { audit, found, type ProductRequest } from './product-common.js';
export async function incidentRequest(client: pg.PoolClient, actor: Actor, workspaceId: string, request: ProductRequest): Promise<unknown> {
    const id = request.path[1];
    if (request.method === 'GET') {
        if (!id)
            return (await client.query('SELECT i.*,m.name AS monitor_name FROM incidents i JOIN monitors m ON m.id=i.monitor_id AND m.workspace_id=i.workspace_id WHERE i.workspace_id=$1 ORDER BY opened_at DESC LIMIT 200', [workspaceId])).rows;
        const incident = found((await client.query('SELECT * FROM incidents WHERE workspace_id=$1 AND id=$2', [workspaceId, id])).rows[0]);
        const events = (await client.query('SELECT * FROM incident_events WHERE workspace_id=$1 AND incident_id=$2 ORDER BY created_at', [workspaceId, id])).rows;
        return { incident, events };
    }
    if (!id)
        throw new AccessError(400, 'Incident required');
    found((await client.query('SELECT id FROM incidents WHERE workspace_id=$1 AND id=$2 FOR UPDATE', [workspaceId, id])).rows[0]);
    const action = request.path[2];
    let message: string;
    if (action === 'acknowledge') {
        await client.query('UPDATE incidents SET acknowledged_by=$3,acknowledged_at=now() WHERE workspace_id=$1 AND id=$2 AND resolved_at IS NULL', [workspaceId, id, actor.userId]);
        message = 'Incident acknowledged';
        await client.query("UPDATE notification_outbox SET state='cancelled' WHERE workspace_id=$1 AND incident_id=$2 AND state='pending' AND event='escalation'", [workspaceId, id]);
    }
    else if (action === 'resolve') {
        const resolution = (request.body as {
            resolution?: unknown;
        })?.resolution;
        if (typeof resolution !== 'string' || resolution.trim().length < 3 || resolution.length > 2000)
            throw new AccessError(400, 'Describe the resolution');
        await client.query("UPDATE incidents SET state='resolved',resolved_at=now(),resolution='manual' WHERE workspace_id=$1 AND id=$2 AND resolved_at IS NULL", [workspaceId, id]);
        message = resolution;
    }
    else
        throw new AccessError(404, 'Unknown incident action');
    await client.query('INSERT INTO incident_events(workspace_id,incident_id,kind,message,actor_id) VALUES($1,$2,$3,$4,$5)', [workspaceId, id, action, message, actor.userId]);
    await audit(client, actor, workspaceId, action, 'incident', id);
    return { id };
}
