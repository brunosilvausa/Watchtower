import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ pool: vi.fn(), end: vi.fn().mockResolvedValue(undefined) }));
vi.mock('pg', () => ({ default: { Pool: class { constructor(config: unknown) { mocks.pool(config); } end = mocks.end; on = vi.fn(); } } }));
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: vi.fn(() => ({})) }));
afterEach(async () => { const db = await import('./index.js'); await db.closeDatabase(); vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('import and unused close never construct a connection pool', async () => {
  const db = await import('./index.js'); await db.closeDatabase(); expect(mocks.pool).not.toHaveBeenCalled();
});
it('creates one bounded pool lazily and closes it once', async () => {
  vi.stubEnv('DATABASE_URL', 'postgresql://example');
  const db = await import('./index.js'); expect(db.getDb()).toBe(db.getDb());
  expect(mocks.pool).toHaveBeenCalledTimes(1);
  expect(mocks.pool).toHaveBeenCalledWith(expect.objectContaining({ max: 5, connectionTimeoutMillis: 5000 }));
  await db.closeDatabase(); await db.closeDatabase(); expect(mocks.end).toHaveBeenCalledTimes(1);
});
it('requires configuration only when requested', async () => {
  vi.stubEnv('DATABASE_URL', ''); const db = await import('./index.js');
  expect(() => db.getDb()).toThrow('DATABASE_URL is required'); expect(mocks.pool).not.toHaveBeenCalled();
});
it.each(['invalid-secret', 'https://user:secret@example.com/db', 'postgresql://user:secret@/db'])('rejects invalid configuration without leaking it', async (value) => {
  vi.stubEnv('DATABASE_URL', value);
  const db = await import('./index.js');
  expect(() => db.getDb()).toThrow('Invalid database configuration');
  expect(mocks.pool).not.toHaveBeenCalled();
});
it('reuses the pool across module reloads', async () => {
  vi.stubEnv('DATABASE_URL', 'postgresql://user:local@example.com/db');
  const before = await import('./index.js');
  const database = before.getDb();
  vi.resetModules();
  const after = await import('./index.js');
  expect(after.getDb()).toBe(database);
  expect(mocks.pool).toHaveBeenCalledTimes(1);
});
it('rejects browser entry', async () => {
  await expect(import('./browser.js')).rejects.toThrow('server-only');
});
