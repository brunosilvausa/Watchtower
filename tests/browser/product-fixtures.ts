import { createRequire } from "node:module";
import { resolve } from "node:path";
type QueryResult = { rows: Record<string, unknown>[] };
type Client = { connect(): Promise<void>; query(sql: string, values?: unknown[]): Promise<QueryResult>; end(): Promise<void> };
const require = createRequire(resolve("apps/web/package.json"));
const { Client: PgClient } = require("pg") as { Client: new (options: { connectionString: string }) => Client };
export async function cleanupBrowserFixture(email: string) {
  if (!/^browser-(desktop|mobile)-\d+@example\.test$/.test(email)) throw new Error("Not a browser fixture identity");
  const connectionString = process.env.DATABASE_MIGRATION_URL ?? "postgresql://watchtower_migrator:local-migrator-only@127.0.0.1:55432/watchtower_dev";
  const url = new URL(connectionString); if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Fixture cleanup requires loopback PostgreSQL");
  const client = new PgClient({ connectionString }); await client.connect();
  try {
    await client.query("BEGIN");
    const user = (await client.query("SELECT id FROM auth_user WHERE email=$1", [email])).rows[0];
    if (!user) { await client.query("ROLLBACK"); return { email, removed: false }; }
    const workspaces = (await client.query("SELECT workspace_id FROM workspace_access WHERE user_id=$1", [user.id])).rows;
    for (const workspace of workspaces) {
      const id = workspace.workspace_id;
      await client.query("SELECT set_config('app.workspace_id',$1,true)", [id]);
      const members = (await client.query("SELECT user_id FROM memberships WHERE workspace_id=$1", [id])).rows;
      if (members.some(member => member.user_id !== user.id)) throw new Error("Fixture workspace contains another user");
      for (const table of ["notification_outbox", "incident_events", "status_subscribers", "status_updates", "status_components", "status_pages", "check_results", "incidents", "monitors", "maintenance_windows", "alert_channels", "alert_policies", "invitations", "api_keys", "webhooks", "audit_events", "subscriptions", "support_sessions", "probes", "memberships"]) await client.query(`DELETE FROM ${table} WHERE workspace_id=$1`, [id]);
      await client.query("DELETE FROM workspaces WHERE id=$1", [id]);
    }
    await client.query("DELETE FROM users WHERE id=$1", [user.id]);
    await client.query("DELETE FROM auth_user WHERE id=$1", [user.id]);
    await client.query("COMMIT");
    return { email, userId: user.id, workspaceIds: workspaces.map(row => row.workspace_id), removed: true };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { await client.end(); }
}
