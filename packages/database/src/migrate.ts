import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { assertLocalTarget } from './local-target.js';
export async function migrateLocal(connectionString: string): Promise<void> {
  assertLocalTarget(connectionString, 'watchtower_migrator');
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000, statement_timeout: 30000 });
  try {
    await client.connect();
    await client.query('SELECT pg_advisory_lock(73209410)');
    await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL('../migrations', import.meta.url)) });
  } finally { await client.end(); }
}
