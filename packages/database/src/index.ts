import { databaseUrlSchema } from '@watchtower/runtime';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
type DatabaseState = { pool: pg.Pool; database: NodePgDatabase<typeof schema> };
// Keep a single pool when Next reloads server modules during local development.
const cache = globalThis as typeof globalThis & { watchtowerDatabase?: DatabaseState };
export function getDb(): NodePgDatabase<typeof schema> {
  if (cache.watchtowerDatabase) return cache.watchtowerDatabase.database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  if (!databaseUrlSchema.safeParse(connectionString).success) throw new Error('Invalid database configuration; credentials omitted');
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000 });
  pool.on('error', () => { process.stderr.write('Database idle connection failed; credentials omitted\n'); });
  const database = drizzle(pool, { schema });
  cache.watchtowerDatabase = { pool, database };
  return database;
}
export async function closeDatabase(): Promise<void> {
  const state = cache.watchtowerDatabase;
  delete cache.watchtowerDatabase;
  await state?.pool.end();
}
export * from './schema.js';
export * from './product.js';
export * from './product-service.js';
export { monitorSchema, plans, toCsv } from './product-validation.js';
export { tokenHash, verifyPagePassword, decryptSecret } from './product-secrets.js';
export { verifyBillingSignature } from './product-billing.js';
export * from './jobs.js';
export * from './product-public.js';
export * from './jobs-private.js';
export * from './product-lifecycle.js';
