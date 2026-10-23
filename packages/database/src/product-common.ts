import type pg from 'pg';
import { AccessError, type Actor } from './product.js';
export async function audit(client: pg.PoolClient, actor: Actor, workspaceId: string, action: string, resource: string, id?: string): Promise<void> { await client.query('INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,resource_id) VALUES($1,$2,$3,$4,$5)', [workspaceId, actor.userId, action, resource, id ?? null]); }
export function found<T>(value: T | undefined): T { if (value === undefined)
    throw new AccessError(404, 'Resource not found'); return value; }
export async function workspacePlan(client: pg.PoolClient, workspaceId: string): Promise<string> { return String(found((await client.query('SELECT plan FROM workspaces WHERE id=$1', [workspaceId])).rows[0]).plan); }
export async function validateMonitorIds(client: pg.PoolClient, workspaceId: string, ids: string[]): Promise<void> { const result = await client.query('SELECT id FROM monitors WHERE workspace_id=$1 AND id=ANY($2::uuid[]) AND archived_at IS NULL', [workspaceId, ids]); if (result.rowCount !== new Set(ids).size)
    throw new AccessError(400, 'Invalid monitor selection'); }
export type ProductRequest = {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string[];
    body: unknown;
    range?: '24h' | '7d' | '30d';
};
export type ProductResponse = {
    status: number;
    data: unknown;
};
