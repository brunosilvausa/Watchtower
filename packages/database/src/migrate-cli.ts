import { migrateLocal } from './migrate.js';
try {
  await migrateLocal(process.env.DATABASE_MIGRATION_URL ?? '');
  process.stdout.write('Local database migrations applied.\n');
} catch {
  process.stderr.write('Local migration failed. Check local target, role and SQL; credentials omitted.\n');
  process.exitCode = 1;
}
