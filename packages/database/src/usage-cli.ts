import pg from 'pg';
import { assertLocalTarget } from './local-target.js';
let client: pg.Client | undefined;
try {
  const connectionString = process.env.DATABASE_MIGRATION_URL ?? '';
  assertLocalTarget(connectionString, 'watchtower_migrator');
  client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const database = await client.query('SELECT pg_database_size(current_database())::text AS database_bytes');
  const tables = await client.query("SELECT relname AS table_name, pg_total_relation_size(relid)::text AS total_bytes, n_live_tup::text AS estimated_rows FROM pg_stat_user_tables ORDER BY relname");
  await client.query('COMMIT');
  process.stdout.write(`${JSON.stringify({ observedAt: new Date().toISOString(), ...database.rows[0], tables: tables.rows, note: 'Local storage measurement; row estimates may lag. Not provider billing.' })}\n`);
} catch {
  process.stderr.write('Local database usage query failed; credentials omitted.\n');
  process.exitCode = 1;
} finally { await client?.end(); }
