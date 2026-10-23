import 'server-only';
import { AccessError, getProductPool, type Actor } from '@watchtower/database';
import { getAuth } from './auth';
export { requireWorkspace, withWorkspace, type Actor, type Permission, type WorkspaceRole } from '@watchtower/database';
export async function requireActor(headers: Headers): Promise<Actor> {
  const session = await getAuth().api.getSession({ headers });
  if (!session || !session.user.emailVerified) throw new AccessError(401, 'Authentication required');
  const result = await getProductPool().query<{ platformAdmin: boolean; twoFactorEnabled: boolean }>('SELECT "platformAdmin","twoFactorEnabled" FROM auth_user WHERE id=$1', [session.user.id]);
  const user = result.rows[0];
  return { userId: session.user.id, sessionId: session.session.id, platformAdmin: user?.platformAdmin ?? false, mfaVerified: Boolean(user?.twoFactorEnabled && session.session.mfaVerifiedAt) };
}
