import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { assertLocalTarget } from '../src/local-target.js';
import { migrateLocal } from '../src/migrate.js';

const migrationUrl = process.env.DATABASE_MIGRATION_URL ?? '';
const runtimeUrl = process.env.DATABASE_TEST_URL ?? '';
assertLocalTarget(migrationUrl, 'watchtower_migrator');
assertLocalTarget(runtimeUrl, 'watchtower_app');
const admin = new pg.Pool({ connectionString: migrationUrl, max: 1 });
const runtime = new pg.Pool({ connectionString: runtimeUrl, max: 1 });
const workspaceA = randomUUID();
const workspaceB = randomUUID();
const userId = randomUUID();
beforeAll(async () => {
  await migrateLocal(migrationUrl);
  const before = await admin.query('SELECT count(*) FROM drizzle.__drizzle_migrations');
  await migrateLocal(migrationUrl);
  expect((await admin.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows).toEqual(before.rows);
  await admin.query('INSERT INTO users (id) VALUES ($1)', [userId]);
  // Forced RLS applies even to the migration owner when seeding tenant rows.
  for (const id of [workspaceA, workspaceB]) {
    await admin.query('BEGIN');
    try {
      await admin.query("SELECT set_config('app.workspace_id', $1, true)", [id]);
      await admin.query('INSERT INTO workspaces(id,name) VALUES ($1,$2)', [id, 'Integration fixture']);
      await admin.query('INSERT INTO memberships(workspace_id,user_id) VALUES ($1,$2)', [id,userId]);
      await admin.query('COMMIT');
    } catch (error) { await admin.query('ROLLBACK'); throw error; }
  }
});
afterAll(async () => {
  try {
  for (const id of [workspaceA, workspaceB]) {
    await admin.query('BEGIN');
    try {
      await admin.query("SELECT set_config('app.workspace_id', $1, true)", [id]);
      await admin.query('DELETE FROM memberships WHERE workspace_id=$1', [id]);
      await admin.query('DELETE FROM workspaces WHERE id=$1', [id]);
      await admin.query('COMMIT');
    } catch (error) { await admin.query('ROLLBACK'); throw error; }
  }
  await admin.query('DELETE FROM users WHERE id=$1', [userId]);
  } finally { await Promise.all([admin.end(), runtime.end()]); }
});
it('runtime roles cannot bypass RLS or read identity storage', async () => {
  const roles = await admin.query('SELECT rolname,rolsuper,rolbypassrls FROM pg_roles WHERE rolname IN ($1,$2)', ['watchtower_app','watchtower_worker']);
  expect(roles.rows).toHaveLength(2);
  for (const role of roles.rows) { expect(role.rolsuper).toBe(false); expect(role.rolbypassrls).toBe(false); }
  await expect(runtime.query('SELECT * FROM users')).rejects.toMatchObject({ code: '42501' });
  expect((await admin.query("SELECT has_table_privilege('watchtower_worker', 'workspaces', 'SELECT') AS allowed")).rows[0].allowed).toBe(false);
});
it('denies access without context and resets context after commit and rollback', async () => {
  expect((await runtime.query('SELECT * FROM workspaces')).rowCount).toBe(0);
  await expect(runtime.query('INSERT INTO workspaces(name) VALUES ($1)', ['Denied'])).rejects.toMatchObject({code:'42501'});
  for (const completion of ['COMMIT','ROLLBACK']) {
    const client = await runtime.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.workspace_id', $1, true)", [workspaceA]);
      expect((await client.query('SELECT id FROM workspaces')).rows).toEqual([{id:workspaceA}]);
      expect((await client.query('SELECT workspace_id FROM memberships')).rows).toEqual([{workspace_id:workspaceA}]);
      expect((await client.query('UPDATE workspaces SET name=$1 WHERE id=$2', ['Not allowed',workspaceB])).rowCount).toBe(0);
      expect((await client.query('DELETE FROM memberships WHERE workspace_id=$1', [workspaceB])).rowCount).toBe(0);
      await client.query(completion);
    } finally { client.release(); }
    expect((await runtime.query('SELECT * FROM workspaces')).rowCount).toBe(0);
  }
});
it('rejects tenant reassignment, cross-tenant inserts, duplicate memberships and invalid names', async () => {
  for (const [query, params, code] of [
    ['UPDATE workspaces SET id=$1 WHERE id=$2',[randomUUID(),workspaceA],'42501'],
    ['INSERT INTO memberships(workspace_id,user_id) VALUES ($1,$2)',[workspaceB,userId],'42501'],
    ['INSERT INTO memberships(workspace_id,user_id) VALUES ($1,$2)',[workspaceA,userId],'23505'],
    ['UPDATE workspaces SET name=$1 WHERE id=$2',[' ',workspaceA],'23514'],
    ['INSERT INTO memberships(workspace_id,user_id) VALUES ($1,$2)',[workspaceA,randomUUID()],'23503'],
  ] as const) {
    const client = await runtime.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.workspace_id', $1, true)", [workspaceA]);
      await expect(client.query(query, [...params])).rejects.toMatchObject({code});
    } finally { await client.query('ROLLBACK'); client.release(); }
  }
});
