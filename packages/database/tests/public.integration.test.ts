import { randomUUID,randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll,beforeAll,expect,it,vi } from 'vitest';
import { assertLocalTarget } from '../src/local-target.js';
import { createWorkspace,withWorkspace,type Actor } from '../src/product.js';
import { consumeRateLimit,handlePublicStatus,deleteWorkspace,publishStatusUpdate,resolveStatusDomain } from '../src/product-public.js';
import { decryptSecret,hashPagePassword } from '../src/product-secrets.js';
import { bootstrapLocalAdmin } from '../src/bootstrap-admin.js';
const migrationUrl=process.env.DATABASE_MIGRATION_URL??'',runtimeUrl=process.env.DATABASE_TEST_URL??'';
assertLocalTarget(migrationUrl,'watchtower_migrator');assertLocalTarget(runtimeUrl,'watchtower_app');
const admin=new pg.Pool({connectionString:migrationUrl}),runtime=new pg.Pool({connectionString:runtimeUrl});
const actor:Actor={userId:randomUUID(),sessionId:randomUUID(),platformAdmin:false,mfaVerified:false};
const slug=`status-${randomUUID()}`;let workspace='',pageId='',subscriptionToken='';
beforeAll(async()=>{
  vi.stubEnv('PRODUCT_ENCRYPTION_KEY',randomBytes(32).toString('hex'));vi.stubEnv('BETTER_AUTH_URL','http://localhost:3137');
  await admin.query('INSERT INTO auth_user(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',[actor.userId,'Public fixture',`${actor.userId}@example.test`]);
  await admin.query('INSERT INTO auth_session(id,"userId",token,"expiresAt") VALUES($1,$2,$3,now()+interval \'1 day\')',[actor.sessionId,actor.userId,randomUUID()]);
  workspace=await createWorkspace(actor,'Delete fixture',runtime);
  pageId=await withWorkspace(actor,workspace,'workspace:admin',async client=>(await client.query<{id:string}>('INSERT INTO status_pages(workspace_id,name,slug,published) VALUES($1,$2,$3,true) RETURNING id',[workspace,'Status fixture',slug])).rows[0]!.id,runtime);
});
afterAll(async()=>{
  const client=await admin.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);
  for(const table of ['notification_outbox','status_subscribers','status_updates','status_components','status_pages','audit_events','memberships'])await client.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[workspace]);
  await client.query('DELETE FROM workspaces WHERE id=$1',[workspace]);await client.query('DELETE FROM users WHERE id=$1',[actor.userId]);await client.query('DELETE FROM auth_user WHERE id=$1',[actor.userId]);await client.query('COMMIT');}finally{client.release();await Promise.all([admin.end(),runtime.end()]);vi.unstubAllEnvs();}
});
it('rate limits atomically under concurrency',async()=>{
  const results=await Promise.allSettled(Array.from({length:10},()=>consumeRateLimit(`test:${slug}`,4,60,runtime)));
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(4);
});
it('counts views and enqueues a hashed subscription link that verifies once and unsubscribes',async()=>{
  expect((await handlePublicStatus(slug,{action:'read'},runtime)).name).toBe('Status fixture');
  await handlePublicStatus(slug,{action:'subscribe',email:'reader@example.test'},runtime);
  await withWorkspace(actor,workspace,'read',async client=>{
    expect((await client.query('SELECT views FROM status_pages WHERE id=$1',[pageId])).rows[0].views).toBe('1');
    const outbox=(await client.query('SELECT payload FROM notification_outbox WHERE workspace_id=$1',[workspace])).rows[0];
    expect(outbox.payload.message).toBeUndefined();
    const message=decryptSecret(outbox.payload.encryptedMessage).message??'';
    const url=message.match(/http[^\s]+/)?.[0]??'';subscriptionToken=new URL(url).searchParams.get('verify')??'';
    expect(subscriptionToken).toBeTruthy();
    const stored=(await client.query('SELECT token_hash FROM status_subscribers WHERE page_id=$1',[pageId])).rows[0];expect(stored.token_hash).not.toBe(subscriptionToken);
  },runtime);
  expect(await handlePublicStatus(slug,{action:'verify',token:subscriptionToken},runtime)).toEqual({state:'verified'});
  await expect(handlePublicStatus(slug,{action:'verify',token:subscriptionToken},runtime)).rejects.toMatchObject({status:400});
  await publishStatusUpdate(actor,workspace,pageId,{title:'Operational update',body:'Work is complete.'},runtime);
  await withWorkspace(actor,workspace,'read',async client=>{expect((await client.query("SELECT id FROM notification_outbox WHERE workspace_id=$1 AND event='status-update'",[workspace])).rowCount).toBe(1);},runtime);
  expect(await handlePublicStatus(slug,{action:'unsubscribe',token:subscriptionToken},runtime)).toEqual({state:'unsubscribed'});
});
it('protects passwords, unverified domains and local administrator bootstrap',async()=>{
  const password=await hashPagePassword('Private-status-password');
  await withWorkspace(actor,workspace,'workspace:admin',async client=>{await client.query('UPDATE status_pages SET password_hash=$2,custom_domain=$3 WHERE id=$1',[pageId,password,`${slug}.example.test`]);},runtime);
  await expect(handlePublicStatus(slug,{action:'read'},runtime)).rejects.toMatchObject({status:401});
  expect((await handlePublicStatus(slug,{action:'read',password:'Private-status-password'},runtime)).passwordHash).toBeUndefined();
  expect(await resolveStatusDomain(`${slug}.example.test`,runtime)).toBeNull();
  expect(await bootstrapLocalAdmin(migrationUrl,`${actor.userId}@example.test`)).toBe(false);
  await expect(bootstrapLocalAdmin('postgresql://watchtower_migrator:secret@example.com/watchtower',`${actor.userId}@example.test`)).rejects.toBeTruthy();
});
it('requires deliberate deletion confirmation and recent session then revokes workspace visibility',async()=>{
  await expect(deleteWorkspace(actor,workspace,'wrong',runtime)).rejects.toMatchObject({status:400});
  await runtime.query('UPDATE auth_session SET "createdAt"=now()-interval \'11 minutes\' WHERE id=$1',[actor.sessionId]);
  await expect(deleteWorkspace(actor,workspace,'Delete fixture',runtime)).rejects.toMatchObject({status:403});
  await runtime.query('UPDATE auth_session SET "createdAt"=now() WHERE id=$1',[actor.sessionId]);
  expect((await deleteWorkspace(actor,workspace,'Delete fixture',runtime)).state).toBe('deletion-requested');
  await expect(handlePublicStatus(slug,{action:'read',password:'Private-status-password'},runtime)).rejects.toMatchObject({status:404});
});
it('cancels pending deletion and verifies phone with bounded attempts and hashed encrypted tokens',async()=>{
  const {cancelWorkspaceDeletion,requestPhoneVerification,verifyPhone}=await import('../src/product-lifecycle.js');
  expect(await cancelWorkspaceDeletion(actor,workspace,runtime)).toEqual({state:'restored'});
  vi.stubEnv('TWILIO_ACCOUNT_SID','test-only');vi.stubEnv('TWILIO_AUTH_TOKEN','test-only');vi.stubEnv('TWILIO_FROM','+15551230000');
  await requestPhoneVerification(actor,workspace,'+15551234567',runtime);
  const getCode=async()=>withWorkspace(actor,workspace,'read',async client=>{
    const row=(await client.query("SELECT payload FROM notification_outbox WHERE workspace_id=$1 AND event='phone-verification' ORDER BY created_at DESC LIMIT 1",[workspace])).rows[0];
    return decryptSecret(row.payload.encryptedMessage).message?.match(/\b\d{6}\b/)?.[0]??'';
  },runtime);
  const code=await getCode();expect(code).toHaveLength(6);
  const wrong=String((Number(code)+100)%1000000).padStart(6,'0');
  for(let attempt=0;attempt<5;attempt++)await expect(verifyPhone(actor,wrong,runtime)).rejects.toMatchObject({status:400});
  await expect(verifyPhone(actor,code,runtime)).rejects.toMatchObject({status:400});
  await requestPhoneVerification(actor,workspace,'+15551234567',runtime);
  expect(await verifyPhone(actor,await getCode(),runtime)).toEqual({state:'verified',phone:'+15551234567'});
  await expect(verifyPhone(actor,await getCode(),runtime)).rejects.toMatchObject({status:400});
});
it('support requires real current MFA, expires, denies writes and audits the real actor',async()=>{
  const {startSupportSession}=await import('../src/product.js');
  const support:Actor={userId:randomUUID(),sessionId:randomUUID(),platformAdmin:true,mfaVerified:true};
  await admin.query('INSERT INTO auth_user(id,name,email,"emailVerified","platformAdmin","twoFactorEnabled") VALUES($1,$2,$3,true,true,true)',[support.userId,'Support fixture',`${support.userId}@example.test`]);
  await admin.query('INSERT INTO auth_session(id,"userId",token,"expiresAt") VALUES($1,$2,$3,now()+interval \'1 day\')',[support.sessionId,support.userId,randomUUID()]);
  try {
    await expect(startSupportSession(support,workspace,'Investigate support fixture',15,runtime)).rejects.toMatchObject({code:'42501'});
    await admin.query('UPDATE auth_session SET "mfaVerifiedAt"=now() WHERE id=$1',[support.sessionId]);
    await startSupportSession(support,workspace,'Investigate support fixture',15,runtime);
    expect(await withWorkspace(support,workspace,'read',async client=>(await client.query('SELECT name FROM workspaces WHERE id=$1',[workspace])).rows[0].name,runtime)).toBe('Delete fixture');
    await expect(withWorkspace(support,workspace,'monitor:write',async()=>true,runtime)).rejects.toMatchObject({status:403});
    await withWorkspace(actor,workspace,'read',async client=>{expect((await client.query("SELECT id FROM audit_events WHERE workspace_id=$1 AND actor_id=$2 AND action='support-read'",[workspace,support.userId])).rowCount).toBe(1);},runtime);
    await admin.query('UPDATE support_sessions SET expires_at=now()-interval \'1 second\' WHERE actor_id=$1',[support.userId]);
    await expect(withWorkspace(support,workspace,'read',async()=>true,runtime)).rejects.toMatchObject({status:403});
  }finally{await admin.query('DELETE FROM support_sessions WHERE actor_id=$1',[support.userId]);await admin.query('DELETE FROM auth_user WHERE id=$1',[support.userId]);}
});
it('purges only explicitly selected expired deletion while preserving the user and fresh requests',async()=>{
  const {purgeDeletedWorkspaces}=await import('../src/product-lifecycle.js');
  const workerUrl=process.env.DATABASE_WORKER_URL??'postgresql://watchtower_worker:local-worker-only@127.0.0.1:55432/watchtower_dev';assertLocalTarget(workerUrl,'watchtower_worker');
  const worker=new pg.Pool({connectionString:workerUrl});const target=await createWorkspace(actor,'Purge fixture',runtime);
  try {
    await withWorkspace(actor,target,'monitor:write',async client=>{await client.query("INSERT INTO monitors(workspace_id,name,type,target) VALUES($1,'Purge monitor','http','https://example.test')",[target]);},runtime);
    await deleteWorkspace(actor,target,'Purge fixture',runtime);
    expect(await purgeDeletedWorkspaces(worker,target)).toBe(0);
    const client=await admin.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[target]);await client.query("UPDATE workspaces SET settings=settings||jsonb_build_object('deletionRequestedAt',now()-interval '31 days') WHERE id=$1",[target]);await client.query('COMMIT');}finally{client.release();}
    expect(await purgeDeletedWorkspaces(worker,target)).toBe(1);
    expect((await admin.query('SELECT id FROM auth_user WHERE id=$1',[actor.userId])).rowCount).toBe(1);
    expect((await runtime.query('SELECT * FROM list_user_workspaces($1)',[actor.userId])).rows.some(row=>row.id===workspace)).toBe(true);
  }finally{
    const client=await admin.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[target]);for(const table of ['audit_events','monitors','memberships'])await client.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[target]);await client.query('DELETE FROM workspaces WHERE id=$1',[target]);await client.query('COMMIT');}finally{client.release();await worker.end();}
  }
});
