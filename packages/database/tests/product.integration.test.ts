import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { assertLocalTarget } from '../src/local-target.js';
import { createWorkspace, listWorkspaces, requireWorkspace, withWorkspace, type Actor } from '../src/product.js';
const migrationUrl = process.env.DATABASE_MIGRATION_URL ?? '';
const runtimeUrl = process.env.DATABASE_TEST_URL ?? '';
assertLocalTarget(migrationUrl, 'watchtower_migrator'); assertLocalTarget(runtimeUrl, 'watchtower_app');
const admin = new pg.Pool({ connectionString: migrationUrl });
const runtime = new pg.Pool({ connectionString: runtimeUrl });
const owner: Actor = { userId: randomUUID(), sessionId: randomUUID(), platformAdmin: false, mfaVerified: false };
const viewer: Actor = { ...owner, userId: randomUUID() };
let workspace = '';
beforeAll(async () => {
  for (const actor of [owner, viewer]) await admin.query('INSERT INTO auth_user(id,name,email,"emailVerified") VALUES($1,$2,$3,true)', [actor.userId,'Fixture',`${actor.userId}@example.test`]);
  workspace = await createWorkspace(owner, 'Foundation fixture', runtime);
});
afterAll(async () => {
  if (workspace) await withWorkspace(owner, workspace, 'workspace:delete', async client => { await client.query('DELETE FROM invitations WHERE workspace_id=$1',[workspace]); await client.query('DELETE FROM memberships WHERE workspace_id=$1',[workspace]); await client.query('DELETE FROM workspaces WHERE id=$1',[workspace]); }, runtime);
  await admin.query('DELETE FROM users WHERE id=ANY($1::text[])',[[owner.userId,viewer.userId]]);
  await admin.query('DELETE FROM auth_user WHERE id=ANY($1::text[])',[[owner.userId,viewer.userId]]);
  await Promise.all([admin.end(),runtime.end()]);
});
it('deniesForeignWorkspace and rejectsUnauthenticated', async () => {
  await expect(requireWorkspace(viewer, workspace, 'read', runtime)).rejects.toMatchObject({status:403});
  await expect(requireWorkspace({...owner,userId:''}, workspace, 'read', runtime)).rejects.toMatchObject({status:401});
  expect(await listWorkspaces(owner,runtime)).toEqual([{id:workspace,name:'Foundation fixture',role:'owner'}]);
});
it('inviteConsumedOnce and viewerCannotMutate', async () => {
  const hash = randomUUID();
  await withWorkspace(owner, workspace, 'workspace:admin', async client => { await client.query("INSERT INTO invitations(workspace_id,email,role,token_hash,expires_at) VALUES($1,$2,'viewer',$3,now()+interval '7 days')",[workspace,`${viewer.userId}@example.test`,hash]); },runtime);
  const results = await Promise.allSettled([runtime.query('SELECT accept_invitation($1,$2)',[hash,viewer.userId]),runtime.query('SELECT accept_invitation($1,$2)',[hash,viewer.userId])]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  await expect(requireWorkspace(viewer,workspace,'monitor:write',runtime)).rejects.toMatchObject({status:403});
});
it('deniesSuspendedWorkspace and clears context', async () => {
  await withWorkspace(owner,workspace,'workspace:admin',async client => { await client.query('UPDATE workspaces SET suspended=true WHERE id=$1',[workspace]); },runtime);
  await expect(requireWorkspace(owner,workspace,'read',runtime)).rejects.toMatchObject({status:403});
  const client = await admin.connect(); try { await client.query('BEGIN'); await client.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]); await client.query('UPDATE workspaces SET suspended=false WHERE id=$1',[workspace]); await client.query('COMMIT'); } finally {client.release();}
  expect((await runtime.query('SELECT * FROM workspaces')).rowCount).toBe(0);
});
