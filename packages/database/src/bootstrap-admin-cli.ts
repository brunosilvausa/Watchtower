import { bootstrapLocalAdmin } from './bootstrap-admin.js';
const [email,confirmation]=process.argv.slice(2);
if(!email||confirmation!=='--confirm-local-admin') {
  process.stderr.write('Usage: bootstrap-admin-cli.ts <existing-verified-email> --confirm-local-admin\n');process.exitCode=1;
} else {
  try {const promoted=await bootstrapLocalAdmin(process.env.DATABASE_MIGRATION_URL??'',email);if(!promoted)throw new Error('Account must exist, have verified email and enrolled TOTP');process.stdout.write('Local platform administrator enabled; sign in and verify TOTP.\n');}
  catch(error){process.stderr.write(error instanceof Error?`${error.message}\n`:'Local bootstrap failed\n');process.exitCode=1;}
}
