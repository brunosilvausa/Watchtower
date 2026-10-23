import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { beforeAll, afterAll, it, expect } from 'vitest';
import { teamRequest } from '../src/product-team.js';
import { encryptSecret } from '../src/product-secrets.js';
import { assertLocalTarget } from '../src/local-target.js';
import { registerWorker, claimChecks, completeCheck, claimDeliveries, completeDelivery, type ClaimedCheck } from '../src/jobs.js';
const migrationUrl=process.env.DATABASE_MIGRATION_URL ?? '';
const workerUrl=process.env.DATABASE_WORKER_URL ?? 'postgresql://watchtower_worker:local-worker-only@127.0.0.1:55432/watchtower_dev';
assertLocalTarget(migrationUrl,'watchtower_migrator');assertLocalTarget(workerUrl,'watchtower_worker');
const admin=new pg.Pool({connectionString:migrationUrl});const worker=new pg.Pool({connectionString:workerUrl});
const region=`test-${randomUUID().slice(0,8)}`;
const privateId=`private-${randomUUID()}`;
const tenant=randomUUID();const user=randomUUID();const monitor=randomUUID();const channel=randomUUID();const workerId=`test-${randomUUID()}`;
async function scoped<T>(operation:(client:pg.PoolClient)=>Promise<T>):Promise<T>{const client=await admin.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[tenant]);const result=await operation(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
async function due():Promise<void>{await scoped(async client=>{await client.query('SELECT request_monitor_check($1)',[monitor]);});}
async function check(state:'up'|'down'):Promise<void>{await due();const [claim]=await claimChecks(workerId,region,1,worker);expect(claim).toBeDefined();expect(await completeCheck(claim!,{state,durationMs:10,statusCode:state==='up'?200:503,errorCode:null,observedAt:new Date()},worker)).toBe(true);}
beforeAll(async()=>{
 await admin.query('INSERT INTO auth_user(id,name,email) VALUES($1,$2,$3)',[user,'Worker fixture',`${user}@example.test`]);
 await admin.query('SELECT create_user_workspace($1,$2,$3)',[user,tenant,'Worker fixture']);
 await scoped(async client=>{
  await client.query("INSERT INTO monitors(id,workspace_id,name,type,target,config) VALUES($1,$2,'Fixture','http','https://example.test',$3)",[monitor,tenant,JSON.stringify({regions:[region]})]);
  await client.query("INSERT INTO alert_channels(id,workspace_id,name,type,destination) VALUES($1,$2,'Fixture email','email','test@example.test')",[channel,tenant]);
  await client.query("INSERT INTO alert_policies(workspace_id,name,config) VALUES($1,'Fixture',$2)",[tenant,JSON.stringify({escalation:true,recovery:true})]);
 });
 expect(await registerWorker(workerId,region,['http'],worker)).toBe(true);
});
afterAll(async()=>{
 await admin.query('DELETE FROM probes WHERE id=ANY($1::text[])',[[workerId,privateId]]);
 await scoped(async client=>{
  for(const table of ['notification_outbox','invitations','incident_events','incidents','check_results','maintenance_windows','alert_policies','alert_channels','webhooks','audit_events','monitors','memberships'])await client.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[tenant]);
  await client.query('DELETE FROM workspaces WHERE id=$1',[tenant]);
 });
 await admin.query('DELETE FROM probes WHERE id=ANY($1::text[])',[[workerId,privateId]]);await admin.query('DELETE FROM users WHERE id=$1',[user]);await admin.query('DELETE FROM auth_user WHERE id=$1',[user]);await Promise.all([admin.end(),worker.end()]);
});
it('worker has no direct auth or tenant data privileges',async()=>{
 await expect(worker.query('SELECT * FROM auth_user')).rejects.toMatchObject({code:'42501'});
 await expect(worker.query('SELECT * FROM monitors')).rejects.toMatchObject({code:'42501'});
});
it('live held claim transaction excludes a second worker connection',async()=>{
 const first=await worker.connect();try{
  await first.query('BEGIN');const claim=await first.query('SELECT * FROM worker_claim_checks($1,$2,1)',[workerId,region]);expect(claim.rowCount).toBe(1);
  const locks=await first.query("SELECT count(*)::int n FROM pg_locks WHERE pid=pg_backend_pid() AND granted AND locktype='advisory'");expect(locks.rows[0].n).toBeGreaterThan(0);
  expect(await claimChecks(workerId,region,1,worker)).toHaveLength(0);
  await first.query('ROLLBACK');
 }finally{first.release();}
});
it('fences config changes and expired leases without recording results',async()=>{
 const [claim]=await claimChecks(workerId,region,1,worker);expect(claim).toBeDefined();
 await scoped(async client=>{await client.query('UPDATE monitors SET config_version=config_version+1 WHERE id=$1',[monitor]);});
 expect(await completeCheck(claim!,{state:'up',durationMs:1,statusCode:200,errorCode:null,observedAt:new Date()},worker)).toBe(false);
 await scoped(async client=>{await client.query("UPDATE monitor_region_schedules SET lease_until=now()-interval '1 second' WHERE monitor_id=$1",[monitor]);});
 expect(await completeCheck({...claim!,configVersion:claim!.configVersion+1},{state:'up',durationMs:1,statusCode:200,errorCode:null,observedAt:new Date()},worker)).toBe(false);
 const count=await scoped(client=>client.query('SELECT count(*)::int n FROM check_results'));expect(count.rows[0].n).toBe(0);
});
it('two failures open once; acknowledgment cancels escalation; two successes recover',async()=>{
 await check('down');expect((await scoped(client=>client.query('SELECT * FROM incidents'))).rowCount).toBe(0);
 await check('down');await check('down');
 const incidents=await scoped(client=>client.query('SELECT * FROM incidents'));expect(incidents.rowCount).toBe(1);
 const notifications=await scoped(client=>client.query('SELECT * FROM notification_outbox'));expect(notifications.rowCount).toBe(3);
 await scoped(async client=>{await client.query('UPDATE incidents SET acknowledged_at=now(),acknowledged_by=$1',[user]);});
 const deliveries=await claimDeliveries(workerId,4,worker);expect(deliveries).toHaveLength(1);expect(deliveries[0]?.job.credentials).toEqual({});
 expect(await completeDelivery(deliveries[0]!,{state:'unconfigured'},worker)).toBe(true);expect(await completeDelivery(deliveries[0]!,{state:'accepted'},worker)).toBe(false);
 expect((await scoped(client=>client.query("SELECT * FROM notification_outbox WHERE state='cancelled'"))).rowCount).toBe(2);
 await check('up');expect((await scoped(client=>client.query('SELECT * FROM incidents WHERE resolved_at IS NULL'))).rowCount).toBe(1);
 await check('up');expect((await scoped(client=>client.query("SELECT * FROM incidents WHERE resolution='observed_recovery'"))).rowCount).toBe(1);
 expect((await scoped(client=>client.query("SELECT * FROM notification_outbox WHERE event='recovery'"))).rowCount).toBe(1);
});
it('maintenance observations do not open incidents or count as observed uptime',async()=>{
 await scoped(async client=>{await client.query("INSERT INTO maintenance_windows(workspace_id,name,starts_at,ends_at) VALUES($1,'Fixture',now()-interval '1 hour',now()+interval '1 hour')",[tenant]);});
 await check('down');await check('down');
 expect((await scoped(client=>client.query('SELECT * FROM incidents WHERE resolved_at IS NULL'))).rowCount).toBe(0);
 expect((await scoped(client=>client.query("SELECT * FROM check_results WHERE state='maintenance' AND maintenance"))).rowCount).toBe(2);
});
it('a stale completion token never applies twice',async()=>{
 await due();const [claim]=await claimChecks(workerId,region,1,worker);
 const result={state:'up' as const,durationMs:1,statusCode:200,errorCode:null,observedAt:new Date()};
 const outcomes=await Promise.all([completeCheck(claim as ClaimedCheck,result,worker),completeCheck(claim as ClaimedCheck,result,worker)]);expect(outcomes.sort()).toEqual([false,true]);
});

it('enrolled private worker is restricted to its workspace and assigned monitor',async()=>{
 const hash='a'.repeat(64);
 await admin.query('SELECT manage_private_probe($1,$2,$3,$4,$5)',[user,tenant,'create',privateId,JSON.stringify({name:'Office probe',region,hash,capabilities:['http']})]);
 const listing=(await admin.query('SELECT manage_private_probe($1,$2,$3,$4,$5) data',[user,tenant,'list','',{}])).rows[0].data as {id:string;name:string}[];expect(listing.find(row=>row.id===privateId)?.name).toBe('Office probe');
 await scoped(async client=>{await client.query("UPDATE monitors SET config_version=config_version+1,config=config||jsonb_build_object('privateProbeId',$1::text),next_check_at=now() WHERE id=$2",[privateId,monitor]);});
 expect(await claimChecks(workerId,region,1,worker)).toHaveLength(0);
 await expect(admin.query('SELECT private_probe_action($1,$2,$3)',['b'.repeat(64),'claim',{}])).rejects.toMatchObject({code:'42501'});
 const response=await admin.query('SELECT private_probe_action($1,$2,$3) data',[hash,'claim',{}]);
 const claims=response.rows[0].data as {id:string;workspace_id:string;lease_token:string;config_version:number}[];expect(claims).toHaveLength(1);expect(claims[0]?.workspace_id).toBe(tenant);
 const claim=claims[0]!;
 const result=await admin.query('SELECT private_probe_action($1,$2,$3) data',[hash,'complete',{id:claim.id,leaseToken:claim.lease_token,configVersion:claim.config_version,result:{state:'up',durationMs:1,statusCode:200,errorCode:null,observedAt:new Date()}}]);expect(result.rows[0].data.applied).toBe(true);
 await admin.query('SELECT manage_private_probe($1,$2,$3,$4,$5)',[user,tenant,'revoke',privateId,{}]);
 await expect(admin.query('SELECT private_probe_action($1,$2,$3)',[hash,'claim',{}])).rejects.toMatchObject({code:'42501'});
 await scoped(async client=>{await client.query("UPDATE monitors SET config_version=config_version+1,config=config-'privateProbeId' WHERE id=$1",[monitor]);});
});
it('configured outbound webhooks enter durable delivery with decrypted signing key',async()=>{
 const previous=process.env.PRODUCT_ENCRYPTION_KEY;process.env.PRODUCT_ENCRYPTION_KEY='ab'.repeat(32);
 try{
  await scoped(async client=>{
   await client.query('DELETE FROM maintenance_windows WHERE workspace_id=$1',[tenant]);
   await client.query("INSERT INTO webhooks(workspace_id,url,encrypted_secret,events) VALUES($1,'https://example.test/webhook',$2,ARRAY['alert','recovery'])",[tenant,encryptSecret({secret:'fixture-signing-key'})]);
  });
  await check('down');await check('down');
  const deliveries=await claimDeliveries(workerId,4,worker);const webhook=deliveries.find(delivery=>delivery.job.channel==='webhook');
  expect(webhook?.job.credentials).toEqual({signingSecret:'fixture-signing-key'});expect(webhook?.job.destination).toBe('https://example.test/webhook');
 }finally{if(previous===undefined)delete process.env.PRODUCT_ENCRYPTION_KEY;else process.env.PRODUCT_ENCRYPTION_KEY=previous;}
});
it('weekly summary respects verified preference, timezone and per-week idempotency',async()=>{
 await admin.query('UPDATE auth_user SET "emailVerified"=true WHERE id=$1',[user]);
 await admin.query('INSERT INTO user_preferences(user_id,preferences) VALUES($1,$2)',[user,{weeklyReport:true,timezone:'America/New_York'}]);
 await scoped(async client=>{
  expect((await client.query("SELECT worker_schedule_weekly($1,'2026-10-26T12:00:00Z') n",[tenant])).rows[0].n).toBe(0);
  expect((await client.query("SELECT worker_schedule_weekly($1,'2026-10-26T14:00:00Z') n",[tenant])).rows[0].n).toBe(1);
  expect((await client.query("SELECT worker_schedule_weekly($1,'2026-10-26T15:00:00Z') n",[tenant])).rows[0].n).toBe(0);
  const report=await client.query("SELECT payload FROM notification_outbox WHERE event='weekly-summary'");expect(report.rows[0].payload.message).toContain('Monitors: 1');
 });
});
it('365-day retention deletes only expired audit rows in current tenant context',async()=>{
 await scoped(async client=>{
  await client.query("INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,created_at) VALUES($1,$2,'old','fixture',now()-interval '366 days'),($1,$2,'recent','fixture',now()-interval '1 day')",[tenant,user]);
  expect((await client.query('SELECT worker_retain_tenant() n')).rows[0].n).toBe(1);
  expect((await client.query("SELECT * FROM audit_events WHERE action='recent'")).rowCount).toBe(1);
 });
});
it('separate region leases execute every configured region and enforce two-round quorum',async()=>{
 const secondWorker=`test-${randomUUID()}`,secondRegion=`test-${randomUUID().slice(0,8)}`,regionalMonitor=randomUUID();
 try{
  await registerWorker(secondWorker,secondRegion,['http'],worker);
  await scoped(async client=>{
   await client.query('UPDATE monitors SET paused=true WHERE id=$1',[monitor]);
   await client.query("UPDATE alert_policies SET config=config||'{\"quorum\":2}'::jsonb");
   await client.query("INSERT INTO monitors(id,workspace_id,name,type,target,config) VALUES($1,$2,'Regional fixture','http','https://example.test',$3)",[regionalMonitor,tenant,{regions:[region,secondRegion]}]);
  });
  const round=async(state:'up'|'down')=>{
   await scoped(client=>client.query('SELECT request_monitor_check($1)',[regionalMonitor]));
   const [a]=await claimChecks(workerId,region,1,worker),[b]=await claimChecks(secondWorker,secondRegion,1,worker);
   expect(a?.id).toBe(regionalMonitor);expect(b?.id).toBe(regionalMonitor);expect(a?.leaseToken).not.toBe(b?.leaseToken);
   expect(await claimChecks(workerId,region,1,worker)).toHaveLength(0);
   const result={state,durationMs:2,statusCode:state==='up'?200:503,errorCode:null,observedAt:new Date()};
   expect(await completeCheck({...a!,region:secondRegion},result,worker)).toBe(false);
   expect(await completeCheck(a!,result,worker)).toBe(true);expect(await completeCheck(b!,result,worker)).toBe(true);
  };
  await round('down');expect((await scoped(client=>client.query('SELECT * FROM incidents WHERE monitor_id=$1',[regionalMonitor]))).rowCount).toBe(0);
  await round('down');expect((await scoped(client=>client.query('SELECT * FROM incidents WHERE monitor_id=$1 AND resolved_at IS NULL',[regionalMonitor]))).rowCount).toBe(1);
  await round('up');expect((await scoped(client=>client.query('SELECT * FROM incidents WHERE monitor_id=$1 AND resolved_at IS NULL',[regionalMonitor]))).rowCount).toBe(1);
  await round('up');expect((await scoped(client=>client.query('SELECT * FROM incidents WHERE monitor_id=$1 AND resolved_at IS NULL',[regionalMonitor]))).rowCount).toBe(0);
  expect((await scoped(client=>client.query('SELECT DISTINCT region FROM check_results WHERE monitor_id=$1',[regionalMonitor]))).rowCount).toBe(2);
 }finally{await admin.query('DELETE FROM probes WHERE id=$1',[secondWorker]);}
});
it('expired final delivery attempt becomes terminal failed after a crash',async()=>{
 const id=randomUUID();
 await scoped(client=>client.query("INSERT INTO notification_outbox(id,workspace_id,channel_id,event,attempts,lease_token,lease_until,idempotency_key) VALUES($1::uuid,$2,$3,'test',5,gen_random_uuid(),now()-interval '1 second',$1::uuid::text)",[id,tenant,channel]));
 expect((await claimDeliveries(workerId,4,worker)).some(delivery=>delivery.id===id)).toBe(false);
 const row=await scoped(client=>client.query('SELECT state,error_code FROM notification_outbox WHERE id=$1',[id]));expect(row.rows[0]).toEqual({state:'failed',error_code:'DELIVERY_ATTEMPTS_EXHAUSTED'});
});
it('persisted team invitation becomes a decryptable worker email and cancellation removes it',async()=>{
 const previousKey=process.env.PRODUCT_ENCRYPTION_KEY,previousOrigin=process.env.BETTER_AUTH_URL;
 process.env.PRODUCT_ENCRYPTION_KEY='ab'.repeat(32);process.env.BETTER_AUTH_URL='https://example.test';
 try{
  await scoped(client=>client.query("UPDATE workspaces SET plan='team' WHERE id=$1",[tenant]));
  const actor={userId:user,sessionId:randomUUID(),platformAdmin:false,mfaVerified:false};
  const invite=await scoped(client=>teamRequest(client,actor,tenant,{method:'POST',path:['invitations'],body:{email:'invitee@example.test',role:'viewer'}})) as {id:string;token:string};
  const deliveries=await claimDeliveries(workerId,16,worker);const delivery=deliveries.find(row=>row.job.destination==='invitee@example.test');expect(delivery).toBeDefined();expect(delivery?.job.channel).toBe('email');expect(delivery?.job.message).toContain(encodeURIComponent(invite.token));
  await scoped(client=>teamRequest(client,actor,tenant,{method:'POST',path:['invitations',invite.id,'resend'],body:{}}));
  expect((await scoped(client=>client.query('SELECT state FROM notification_outbox WHERE id=$1',[delivery!.id]))).rows[0].state).toBe('cancelled');
  await scoped(client=>teamRequest(client,actor,tenant,{method:'DELETE',path:['invitations',invite.id],body:{}}));
  expect((await claimDeliveries(workerId,16,worker)).some(row=>row.job.destination==='invitee@example.test')).toBe(false);
 }finally{if(previousKey===undefined)delete process.env.PRODUCT_ENCRYPTION_KEY;else process.env.PRODUCT_ENCRYPTION_KEY=previousKey;if(previousOrigin===undefined)delete process.env.BETTER_AUTH_URL;else process.env.BETTER_AUTH_URL=previousOrigin;}
});
it('stopped monitors cannot generate or dispatch queued incident reminders',async()=>{
 const outbox=randomUUID();
 await scoped(async client=>{
  await client.query("UPDATE alert_policies SET config=config||'{\"reminders\":true}'::jsonb");
  await client.query("UPDATE incidents SET opened_at=now()-interval '1 hour' WHERE monitor_id=$1 AND resolved_at IS NULL",[monitor]);
  const incident=(await client.query('SELECT id FROM incidents WHERE monitor_id=$1 AND resolved_at IS NULL',[monitor])).rows[0].id;
  await client.query("INSERT INTO notification_outbox(id,workspace_id,channel_id,incident_id,event,idempotency_key) VALUES($1::uuid,$2,$3,$4,'reminder',$1::uuid::text)",[outbox,tenant,channel,incident]);
 });
 expect((await claimDeliveries(workerId,16,worker)).some(row=>row.id===outbox)).toBe(false);
 expect((await scoped(client=>client.query('SELECT state,error_code FROM notification_outbox WHERE id=$1',[outbox]))).rows[0]).toEqual({state:'cancelled',error_code:'MONITOR_STOPPED'});
});
it('completion waits on monitor first so check-now can acquire region locks without deadlock',async()=>{
 const id=randomUUID();await scoped(client=>client.query("INSERT INTO monitors(id,workspace_id,name,type,target,config) VALUES($1,$2,'Lock fixture','http','https://example.test',$3)",[id,tenant,{regions:[region]}]));
 const [claim]=await claimChecks(workerId,region,1,worker);expect(claim?.id).toBe(id);
 const mutator=await admin.connect(),finisher=await worker.connect();let finish:Promise<pg.QueryResult>|undefined;
 try{
  await mutator.query('BEGIN');await mutator.query("SET LOCAL lock_timeout='2s'");await mutator.query("SELECT set_config('app.workspace_id',$1,true)",[tenant]);await mutator.query('SELECT id FROM monitors WHERE id=$1 FOR UPDATE',[id]);
  const mutationPid=(await mutator.query('SELECT pg_backend_pid() pid')).rows[0].pid,completionPid=(await finisher.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  finish=finisher.query('SELECT worker_complete_check($1,$2,$3,$4,$5,$6,$7) applied',[tenant,id,claim!.leaseToken,claim!.configVersion,workerId,region,{state:'up',durationMs:1,statusCode:200,errorCode:null,observedAt:new Date()}]);
  let blocked=false;
  for(let attempt=0;attempt<50;attempt++){
   const blockers=(await admin.query('SELECT pg_blocking_pids($1) blockers',[completionPid])).rows[0].blockers as number[];
   if(blockers.includes(mutationPid)){blocked=true;break;}await new Promise(resolve=>setTimeout(resolve,10));
  }
  expect(blocked).toBe(true);await mutator.query('SELECT request_monitor_check($1)',[id]);await mutator.query('COMMIT');expect((await finish).rows[0].applied).toBe(true);
 }finally{await mutator.query('ROLLBACK');await finish?.catch(()=>{});mutator.release();finisher.release();}
});
