import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { databaseUrlSchema } from '@watchtower/runtime';
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type Permission = 'read' | 'monitor:write' | 'incident:write' | 'maintenance:write' | 'workspace:admin' | 'billing:write' | 'workspace:delete';
export type Actor = { userId: string; sessionId: string; platformAdmin: boolean; mfaVerified: boolean };
export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const permissions: Record<WorkspaceRole, Permission[]> = {
  owner: ['read', 'monitor:write', 'incident:write', 'maintenance:write', 'workspace:admin', 'billing:write', 'workspace:delete'],
  admin: ['read', 'monitor:write', 'incident:write', 'maintenance:write', 'workspace:admin'],
  editor: ['read', 'monitor:write', 'incident:write', 'maintenance:write'], viewer: ['read'],
};
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean { return permissions[role]?.includes(permission) ?? false; }
let productPool: pg.Pool | undefined;
export function getProductPool(): pg.Pool {
  if (!productPool) {
    if (!databaseUrlSchema.safeParse(process.env.DATABASE_URL).success || !process.env.DATABASE_URL || new URL(process.env.DATABASE_URL).username !== 'watchtower_app') throw new Error('A scoped application database URL is required');
    productPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
    productPool.on('error', () => { process.stderr.write('Product database connection failed\n'); });
  }
  return productPool;
}
export async function closeProductPool(): Promise<void> { const pool = productPool; productPool = undefined; await pool?.end(); }
export async function requireWorkspace(actor: Actor, workspaceId: string, permission: Permission, pool = getProductPool()): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  if (!actor.userId) throw new AccessError(401, 'Authentication required');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) throw new AccessError(404, 'Workspace unavailable');
  const result = await pool.query<{ role: WorkspaceRole; suspended: boolean }>('SELECT * FROM authorize_workspace($1,$2)', [actor.userId, workspaceId]);
  let membership = result.rows[0];
  if (!membership && permission === 'read' && actor.platformAdmin && actor.mfaVerified) membership = (await pool.query<{role:WorkspaceRole;suspended:boolean}>('SELECT * FROM authorize_support($1,$2,$3)',[actor.userId,actor.sessionId,workspaceId])).rows[0];
  if (!membership || membership.suspended || !hasPermission(membership.role, permission)) throw new AccessError(403, 'Workspace access denied');
  return { workspaceId, role: membership.role };
}
export async function withWorkspace<T>(actor: Actor, workspaceId: string, permission: Permission, operation: (client: pg.PoolClient, role: WorkspaceRole) => Promise<T>, pool = getProductPool()): Promise<T> {
  if (!actor.userId) throw new AccessError(401, 'Authentication required');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) throw new AccessError(400, 'Invalid workspace identifier');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Hold the workspace lock through authorization and mutation to serialize revocation and quotas.
    const access = await client.query<{ role: WorkspaceRole; suspended: boolean }>('SELECT * FROM authorize_workspace($1,$2)', [actor.userId, workspaceId]);
    let membership = access.rows[0];
    const support = !membership && permission === 'read' && actor.platformAdmin && actor.mfaVerified;
    if (support) membership = (await client.query<{role:WorkspaceRole;suspended:boolean}>('SELECT * FROM authorize_support($1,$2,$3)',[actor.userId,actor.sessionId,workspaceId])).rows[0];
    if (!membership || membership.suspended || !hasPermission(membership.role, permission)) throw new AccessError(403, 'Workspace access denied');
    await client.query("SELECT set_config('app.workspace_id',$1,true)", [workspaceId]);
    if (support) await client.query("INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,resource_id) VALUES($1::uuid,$2,'support-read','workspace',$1::uuid::text)",[workspaceId,actor.userId]);
    const value = await operation(client, membership.role);
    await client.query('COMMIT');
    return value;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
export async function listWorkspaces(actor: Actor, pool = getProductPool()): Promise<{ id: string; name: string; role: WorkspaceRole }[]> {
  const rows = (await pool.query<{ id: string; name: string; role: WorkspaceRole }>('SELECT * FROM list_user_workspaces($1)', [actor.userId])).rows;
  if (actor.platformAdmin && actor.mfaVerified) {
    const support = (await pool.query<{ id: string; name: string; role: WorkspaceRole }>('SELECT * FROM list_support_workspaces($1,$2)',[actor.userId,actor.sessionId])).rows;
    rows.push(...support.filter(row=>!rows.some(existing=>existing.id===row.id)));
  }
  return rows;
}
export async function createWorkspace(actor: Actor, name: string, pool = getProductPool()): Promise<string> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) throw new AccessError(400, 'Workspace name must contain 1–100 characters');
  const id = randomUUID();
  await pool.query('SELECT create_user_workspace($1,$2,$3)', [actor.userId, id, trimmed]);
  return id;
}

export async function startSupportSession(actor:Actor,workspaceId:string,reason:string,durationMinutes=15,pool=getProductPool()):Promise<{id:string;expiresAt:Date}> {
  if(!actor.platformAdmin||!actor.mfaVerified)throw new AccessError(403,'Administrator MFA required');
  if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>30||reason.trim().length<10||reason.length>500)throw new AccessError(400,'Provide a support reason and duration between 1 and 30 minutes');
  const row=(await pool.query<{id:string;expires_at:Date}>('SELECT * FROM start_support_session($1,$2,$3,$4,$5)',[actor.userId,actor.sessionId,workspaceId,reason.trim(),durationMinutes])).rows[0];
  if(!row)throw new AccessError(403,'Support access denied');return {id:row.id,expiresAt:row.expires_at};
}
