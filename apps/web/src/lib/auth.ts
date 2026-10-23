import 'server-only';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { twoFactor } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { sso } from '@better-auth/sso';
import { scim } from '@better-auth/scim';
import pg from 'pg';
import { AccessError } from '@watchtower/database';
import { databaseUrlSchema } from '@watchtower/runtime';
import { sendIdentityEmail } from './auth-mail';

function createAuth() {
const connectionString = process.env.DATABASE_AUTH_URL ?? process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
if (!connectionString || !databaseUrlSchema.safeParse(connectionString).success || new URL(connectionString).username !== 'watchtower_app' || !secret || secret.length < 32 || !baseURL) throw new AccessError(503, 'Authentication is not configured');
let origin: URL;
try { origin = new URL(baseURL); } catch { throw new AccessError(503, 'Authentication is not configured'); }
if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) throw new AccessError(503, 'Authentication is not configured');
const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 });
pool.on('error', () => { process.stderr.write('Authentication database connection failed\n'); });
return betterAuth({
  disabledPaths: ['/sso/register', '/sso/update-provider', '/sso/delete-provider'],
  appName: 'Watchtower', database: pool, baseURL,
  secret,
  user: { modelName: 'auth_user', additionalFields: { platformAdmin: { type: 'boolean', defaultValue: false, input: false, returned: false }, scimWorkspace: { type: 'string', required: false, input: false, returned: false }, scimActive: { type: 'boolean', required: false, input: false, returned: false } } },
  session: { modelName: 'auth_session', expiresIn: 2592000, cookieCache: { enabled: false }, additionalFields: { mfaVerifiedAt: { type: 'date', required: false, input: false } } },
  account: { modelName: 'auth_account', accountLinking: { enabled: false } },
  verification: { modelName: 'auth_verification' },
  rateLimit: { enabled: true, storage: 'database', modelName: 'auth_rate_limit', window: 60, max: 30, customRules: { '/get-session': { window: 60, max: 180 }, '/sign-in/email': { window: 60, max: 10 }, '/sign-up/email': { window: 60, max: 5 }, '/request-password-reset': { window: 60, max: 3 } } },
  emailAndPassword: { enabled: true, minPasswordLength: 10, requireEmailVerification: true, resetPasswordTokenExpiresIn: 1800, revokeSessionsOnPasswordReset: true, sendResetPassword: async ({ user, url }) => sendIdentityEmail(user.email, url, 'Reset your Watchtower password') },
  emailVerification: { sendOnSignUp: true, autoSignInAfterVerification: false, sendVerificationEmail: async ({ user, url }) => sendIdentityEmail(user.email, url, 'Verify your Watchtower email') },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } } : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } } : {}),
  },
  hooks: { after: createAuthMiddleware(async (ctx) => {
    if (!['/two-factor/verify-totp', '/two-factor/verify-backup-code'].includes(ctx.path)) return;
    const returned = ctx.context.returned;
    if (!returned || typeof returned !== 'object' || !('token' in returned) || typeof returned.token !== 'string' || !('user' in returned)) return;
    const token = ctx.context.newSession?.session.token ?? returned.token;
    await pool.query('UPDATE auth_session SET "mfaVerifiedAt"=now() WHERE token=$1', [token]);
  }) },
  plugins: [twoFactor({ issuer: 'Watchtower' }), passkey(), sso({ providersLimit: 0, domainVerification: { enabled: true } }), scim({ connections: process.env.SCIM_WORKSPACE_ID && process.env.SCIM_BEARER_TOKEN ? [{ id: process.env.SCIM_WORKSPACE_ID, provisioningDomainId: process.env.SCIM_WORKSPACE_ID, credentials: [{ type: 'bearer', id: 'configured', token: process.env.SCIM_BEARER_TOKEN }] }] : [], authentication: { verifyBearerToken: () => null }, projection: { reconcileUser: async (state, context) => { await context.database.update({ model: 'user', where: [{ field: 'id', value: state.userId }], update: { scimWorkspace: state.provisioningDomainId, scimActive: state.active } }); } } })],
});

}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth(): ReturnType<typeof createAuth> {
  return instance ??= createAuth();
}
