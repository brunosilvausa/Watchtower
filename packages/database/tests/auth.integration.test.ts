import { createHmac, randomUUID } from 'node:crypto';
import pg from 'pg';
import { mkdtemp, readdir, readFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapLocalAdmin } from '../src/bootstrap-admin.js';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { assertLocalTarget } from '../src/local-target.js';
vi.mock('server-only', () => ({}));
const runtimeUrl = process.env.DATABASE_TEST_URL ?? '';
assertLocalTarget(runtimeUrl, 'watchtower_app');
const pool = new pg.Pool({connectionString:runtimeUrl});
let auth: ReturnType<typeof import('../../../apps/web/src/lib/auth.js').getAuth>;
let verificationUrl = '';
let resetUrl = '';
const email = `auth-${randomUUID()}@example.test`;
let userId = '';
const scimWorkspace=randomUUID(),scimBearer=randomUUID()+randomUUID();
beforeAll(async () => {
  vi.stubEnv('DATABASE_URL',runtimeUrl);vi.stubEnv('DATABASE_AUTH_URL',runtimeUrl);vi.stubEnv('MAIL_TRANSPORT','resend');
  vi.stubEnv('SCIM_WORKSPACE_ID',scimWorkspace);vi.stubEnv('SCIM_BEARER_TOKEN',scimBearer);
  vi.stubEnv('BETTER_AUTH_URL','http://localhost:3137');
  vi.stubEnv('BETTER_AUTH_SECRET',randomUUID()+randomUUID());
  vi.stubEnv('RESEND_API_KEY','test-only-no-provider');
  vi.stubEnv('EMAIL_FROM','test@example.test');
  vi.stubGlobal('fetch', vi.fn((_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as {subject:string;text:string};
    const url = body.text.split('\n\n')[1] ?? '';
    if(body.subject.startsWith('Verify')) verificationUrl=url; else resetUrl=url;
    return Promise.resolve(new Response('{}',{status:200}));
  }));
  const {getAuth} = await import('../../../apps/web/src/lib/auth.js');
  auth = getAuth();
});
afterAll(async () => {
  if(userId) await pool.query('DELETE FROM auth_user WHERE id=$1',[userId]);
  await pool.query('DELETE FROM auth_verification WHERE identifier LIKE $1',[`%${email}%`]);
  await pool.end(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
});
it('registers with verification, denies unverified login, verifies and authenticates a real persisted session', async () => {
  const signed = await auth.api.signUpEmail({body:{name:'Auth fixture',email,password:'Long-test-password-123'}});
  userId = signed.user.id;
  expect(verificationUrl).toContain('/verify-email?');
  await expect(auth.api.signInEmail({body:{email,password:'Long-test-password-123'}})).rejects.toMatchObject({status:'FORBIDDEN'});
  const token = new URL(verificationUrl).searchParams.get('token') ?? '';
  await auth.api.verifyEmail({query:{token}});
  const login = await auth.api.signInEmail({body:{email,password:'Long-test-password-123',rememberMe:true}});
  expect(login.token).toBeTruthy();
  const sessions = await pool.query('SELECT "expiresAt","createdAt" FROM auth_session WHERE "userId"=$1',[userId]);
  expect(sessions.rowCount).toBe(1);
  expect((new Date(sessions.rows[0].expiresAt).getTime()-new Date(sessions.rows[0].createdAt).getTime())/1000).toBeGreaterThan(2591900);
});
it('reset token changes password and revokes sessions', async () => {
  await auth.api.requestPasswordReset({body:{email,redirectTo:'http://localhost:3137/reset-password'}});
  expect(resetUrl).toBeTruthy();
  const token = new URL(resetUrl).pathname.split('/').at(-1) ?? '';
  await auth.api.resetPassword({body:{token,newPassword:'New-long-test-password-456'}});
  expect((await pool.query('SELECT id FROM auth_session WHERE "userId"=$1',[userId])).rowCount).toBe(0);
  await expect(auth.api.signInEmail({body:{email,password:'Long-test-password-123'}})).rejects.toBeTruthy();
  expect((await auth.api.signInEmail({body:{email,password:'New-long-test-password-456'}})).token).toBeTruthy();
});

it('TOTP enrollment records session-specific proof and invalid codes cannot create proof', async () => {
  const response = await auth.api.signInEmail({body:{email,password:'New-long-test-password-456'},asResponse:true});
  const cookie = response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
  const headers = new Headers({cookie});
  const enrollment = await auth.api.enableTwoFactor({headers,body:{password:'New-long-test-password-456'}});
  expect(enrollment.backupCodes.length).toBeGreaterThan(0);
  const secret = new URL(enrollment.totpURI).searchParams.get('secret') ?? '';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret.toUpperCase().replace(/=+$/,'')].map(char=>alphabet.indexOf(char).toString(2).padStart(5,'0')).join('');
  const key = Buffer.from(bits.match(/.{8}/g)?.map(byte=>Number.parseInt(byte,2)) ?? []);
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const digest = createHmac('sha1',key).update(counter).digest();
  const offset = (digest.at(-1) ?? 0) & 15;
  const code = String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
  const wrongCode = String((Number(code)+100)%1000000).padStart(6,'0');
  await expect(auth.api.verifyTOTP({headers,body:{code:wrongCode}})).rejects.toBeTruthy();
  expect((await pool.query('SELECT id FROM auth_session WHERE \"userId\"=$1 AND \"mfaVerifiedAt\" IS NOT NULL',[userId])).rowCount).toBe(0);
  await auth.api.verifyTOTP({headers,body:{code}});
  const proof = await pool.query('SELECT id FROM auth_session WHERE "userId"=$1 AND "mfaVerifiedAt" IS NOT NULL',[userId]);
  expect(proof.rowCount).toBe(1);
  expect(await bootstrapLocalAdmin(process.env.DATABASE_MIGRATION_URL??'',email)).toBe(true);
});

it('local verification mail is private and rejects public host configuration',async()=>{
  const {sendIdentityEmail}=await import('../../../apps/web/src/lib/auth-mail.js');
  const directory=await mkdtemp(join(tmpdir(),'watchtower-auth-mail-test-'));
  vi.stubEnv('MAIL_TRANSPORT','local');vi.stubEnv('AUTH_MAIL_DIRECTORY',directory);
  try {
    await sendIdentityEmail(email,'http://localhost:3137/verify?token=test','Verify fixture');
    const files=await readdir(directory);expect(files).toHaveLength(1);
    expect(JSON.parse(await readFile(join(directory,files[0]!), 'utf8')).to).toBe(email);
    vi.stubEnv('BETTER_AUTH_URL','https://public.example');
    await expect(sendIdentityEmail(email,'https://public.example/verify','Verify fixture')).rejects.toThrow('loopback');
    vi.stubEnv('BETTER_AUTH_URL','http://localhost:3137');await chmod(directory,0o755);
    await expect(sendIdentityEmail(email,'http://localhost:3137/verify','Verify fixture')).rejects.toThrow('private');
  }finally{await rm(directory,{recursive:true,force:true});}
});

it('SCIM authenticated provisioning creates and deactivates only its Enterprise membership',async()=>{
  const admin=new pg.Pool({connectionString:process.env.DATABASE_MIGRATION_URL});
  const scimEmail=`scim-${randomUUID()}@example.test`;let provisionedUser='';
  const scoped=async(query:string,params:unknown[]=[])=>{const client=await admin.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[scimWorkspace]);const result=await client.query(query,params);await client.query('COMMIT');return result;}finally{client.release();}};
  try {
    await admin.query('SELECT create_user_workspace($1,$2,$3)',[userId,scimWorkspace,'SCIM fixture']);
    await scoped("UPDATE workspaces SET plan='enterprise' WHERE id=$1",[scimWorkspace]);
    const endpoint='http://localhost:3137/api/auth/scim/v2/Users';
    const input={schemas:['urn:ietf:params:scim:schemas:core:2.0:User'],userName:scimEmail,displayName:'SCIM fixture',emails:[{value:scimEmail,primary:true}],active:true};
    const rejected=await auth.handler(new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/scim+json',Authorization:'Bearer invalid'},body:JSON.stringify(input)}));expect(rejected.status).toBe(401);
    const response=await auth.handler(new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/scim+json',Authorization:`Bearer ${scimBearer}`},body:JSON.stringify(input)}));
    expect(response.status).toBe(201);const resource=await response.json() as {id:string};
    provisionedUser=(await admin.query('SELECT id FROM auth_user WHERE email=$1',[scimEmail])).rows[0]?.id??'';
    expect((await scoped('SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2',[scimWorkspace,provisionedUser])).rows).toEqual([{role:'viewer'}]);
    const deactivated=await auth.handler(new Request(`${endpoint}/${resource.id}`,{method:'PATCH',headers:{'Content-Type':'application/scim+json',Authorization:`Bearer ${scimBearer}`},body:JSON.stringify({schemas:['urn:ietf:params:scim:api:messages:2.0:PatchOp'],Operations:[{op:'replace',path:'active',value:false}]})}));expect(deactivated.status).toBe(200);
    expect((await scoped('SELECT user_id FROM memberships WHERE workspace_id=$1 AND user_id=$2',[scimWorkspace,provisionedUser])).rowCount).toBe(0);
  }finally{
    for(const table of ['scimProjectionGrant','scimGroupMember','scimGroup','scimUser','scimIdentityTombstone','scimConnectionBinding'])await admin.query(`DELETE FROM "${table}" WHERE "connectionId"=$1`,[scimWorkspace]);
    if(provisionedUser)await admin.query('DELETE FROM "scimSubject" WHERE "userId"=$1',[provisionedUser]);
    await scoped('DELETE FROM memberships WHERE workspace_id=$1',[scimWorkspace]);await scoped('DELETE FROM workspaces WHERE id=$1',[scimWorkspace]);
    if(provisionedUser){await admin.query('DELETE FROM users WHERE id=$1',[provisionedUser]);await admin.query('DELETE FROM auth_user WHERE id=$1',[provisionedUser]);}
    await admin.end();
  }
});
