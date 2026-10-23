import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { beforeAll,afterAll,it,expect } from 'vitest';
import { migrateLocal } from '../src/migrate.js';
import { assertLocalTarget } from '../src/local-target.js';
import { createWorkspace,closeProductPool,type Actor } from '../src/product.js';
import { decryptSecret, tokenHash } from '../src/product-secrets.js';
import { handleWorkspaceRequest } from '../src/product-service.js';
const url=process.env.DATABASE_MIGRATION_URL??'';assertLocalTarget(url,'watchtower_migrator');
const admin=new pg.Pool({connectionString:url,max:1});const owner:Actor={userId:randomUUID(),sessionId:'test',platformAdmin:false,mfaVerified:false};const other:Actor={...owner,userId:randomUUID()};const viewer:Actor={...owner,userId:randomUUID()};let workspace='',foreign='';
const call=(actor:Actor,path:string[],method:'GET'|'POST'|'PATCH'|'DELETE'='GET',body:unknown={})=>handleWorkspaceRequest(actor,workspace,{method,path,body});
beforeAll(async()=>{await migrateLocal(url);for(const actor of [owner,other,viewer])await admin.query('INSERT INTO auth_user(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',[actor.userId,'Product test',actor.userId+'@example.invalid']);workspace=await createWorkspace(owner,'Product test');foreign=await createWorkspace(other,'Other test');
 await admin.query('BEGIN');await admin.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);await admin.query('INSERT INTO users(id) VALUES($1)',[viewer.userId]);await admin.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'viewer')",[workspace,viewer.userId]);await admin.query('COMMIT');});
afterAll(async()=>{try{for(const id of [workspace,foreign]){if(!id)continue;await admin.query('BEGIN');await admin.query("SELECT set_config('app.workspace_id',$1,true)",[id]);for(const table of ['notification_outbox','incident_events','incidents','check_results','status_components','status_pages','maintenance_windows','alert_policies','alert_channels','api_keys','webhooks','audit_events','invitations','monitors','subscriptions','memberships'])await admin.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[id]);await admin.query('DELETE FROM workspaces WHERE id=$1',[id]);await admin.query('COMMIT');}for(const actor of [owner,other,viewer]){await admin.query('DELETE FROM users WHERE id=$1',[actor.userId]);await admin.query('DELETE FROM auth_user WHERE id=$1',[actor.userId]);}}finally{await admin.end();await closeProductPool();}});
it('denies foreign tenant and viewer mutations and preserves empty uptime',async()=>{
 await expect(call(other,['monitors'])).rejects.toMatchObject({status:403});await expect(call(viewer,['monitors'],'POST',{name:'no',type:'http',target:'https://example.com'})).rejects.toMatchObject({status:403});
 const value=await call(owner,['dashboard']);expect(value.data).toMatchObject({summary:{checks:0,uptime:null,p95:null}});
});
it('persists creation, pause/resume and scoped detail',async()=>{
 const created=await call(owner,['monitors'],'POST',{name:'Example',type:'http',target:'https://example.com'});const id=(created.data as {id:string}).id;
 await call(owner,['monitors',id],'PATCH',{status:'paused'});expect((await call(owner,['monitors',id])).data).toMatchObject({monitor:{paused:true}});
 await call(owner,['monitors',id],'PATCH',{status:'active'});expect((await call(owner,['monitors',id])).data).toMatchObject({monitor:{paused:false,state:'unknown'}});
 await expect(handleWorkspaceRequest(other,foreign,{path:['monitors',id],method:'GET',body:{}})).rejects.toMatchObject({status:404});
 const heartbeat = (await call(owner,['monitors',id],'PATCH',{name:'Heartbeat',type:'heartbeat',target:'heartbeat'})).data as {heartbeatToken:string};
 expect(heartbeat.heartbeatToken).toMatch(/^wt_hb_/);
 await admin.query('BEGIN');await admin.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);
 expect((await admin.query('SELECT heartbeat_hash FROM monitors WHERE id=$1',[id])).rows[0].heartbeat_hash).toBe(tokenHash(heartbeat.heartbeatToken));await admin.query('COMMIT');
 const steps=[{url:'https://example.com/private',method:'POST',headers:{Authorization:'Bearer fixture-secret'},body:'{"hello":true}'}];
 await call(owner,['monitors',id],'PATCH',{name:'API',type:'api',target:'https://example.com',config:{steps}});
 await admin.query('BEGIN');await admin.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);
 await admin.query("UPDATE monitors SET state='down',failure_count=2 WHERE id=$1",[id]);
 const incident=(await admin.query("INSERT INTO incidents(workspace_id,monitor_id,title) VALUES($1,$2,'Test outage') RETURNING id",[workspace,id])).rows[0].id;
 await admin.query("INSERT INTO notification_outbox(workspace_id,incident_id,event,payload,idempotency_key) VALUES($1,$2,'reminder','{}',$3)",[workspace,incident,randomUUID()]);await admin.query('COMMIT');
 await call(owner,['monitors',id],'PATCH',{name:'Renamed API',type:'api',target:'https://example.com',config:{}});
 expect((await call(owner,['monitors',id])).data).toMatchObject({monitor:{state:'down',failure_count:2}});
 const safe=JSON.stringify((await call(owner,['monitors',id])).data);expect(safe).toContain('stepsProtected');expect(safe).not.toContain('fixture-secret');
 await admin.query('BEGIN');await admin.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);
 const stored=(await admin.query('SELECT config,heartbeat_hash FROM monitors WHERE id=$1',[id])).rows[0];expect(stored.heartbeat_hash).toBeNull();expect(JSON.parse(decryptSecret(stored.config.encryptedSteps).steps!)).toEqual(steps);await admin.query('COMMIT');
 await call(owner,['monitors',id],'PATCH',{status:'paused'});
 await admin.query('BEGIN');await admin.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);
 expect((await admin.query('SELECT resolution FROM incidents WHERE id=$1',[incident])).rows[0].resolution).toBe('monitor_paused');
 expect((await admin.query('SELECT state FROM notification_outbox WHERE incident_id=$1',[incident])).rows[0].state).toBe('cancelled');await admin.query('COMMIT');


});
it('serializes concurrent quota creation with no overrun',async()=>{
 const results=await Promise.allSettled(Array.from({length:12},(_,i)=>call(owner,['monitors'],'POST',{name:'Quota '+i,type:'http',target:'https://example.com'})));
 expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(9);expect((await call(owner,['monitors'])).data).toHaveLength(10);
});
it('guards last owner and prevents member role escalation',async()=>{await expect(call(owner,['team',owner.userId],'DELETE')).rejects.toMatchObject({status:409});await expect(call(viewer,['team',viewer.userId],'PATCH',{role:'owner'})).rejects.toMatchObject({status:403});});
it('never returns API token hash and revocation disables resolution',async()=>{
 const response=await call(owner,['api-keys'],'POST',{name:'CI',scopes:['read']});const key=response.data as {id:string;token:string};expect(key.token).toMatch(/^wt_live_/);
 const list=await call(owner,['api-keys']);expect(JSON.stringify(list.data)).not.toContain(key.token);expect(JSON.stringify(list.data)).not.toContain('token_hash');
 await call(owner,['api-keys',key.id],'DELETE');expect((await call(owner,['api-keys'])).data).toEqual(expect.arrayContaining([expect.objectContaining({id:key.id,revoked_at:expect.any(Date)})]));
});
it('status visibility persists and unpublished pages are not public',async()=>{
 const created=await call(owner,['status-pages'],'POST',{name:'Test status',slug:'test-'+randomUUID(),published:false});const page=created.data as {id:string;slug:string};
 expect((await admin.query('SELECT read_status_page($1) AS data',[page.slug])).rows[0].data).toBeNull();expect((await call(owner,['status-pages',page.id,'preview'])).data).toMatchObject({name:'Test status',components:[]});await call(owner,['status-pages',page.id],'PATCH',{published:true});expect((await admin.query('SELECT read_status_page($1) AS data',[page.slug])).rows[0].data).toMatchObject({name:'Test status'});
});
it('deduplicates signed billing snapshots and ignores stale subscription state',async()=>{
 const event='evt_'+randomUUID(),customer='cus_'+randomUUID(),subscription='sub_'+randomUUID();
 const apply=(eventId:string,hash:string,state:string,time:number)=>admin.query('SELECT apply_billing_snapshot($1,$2,$3,$4,$5,$6,$7,NULL,$8,$9,$10) AS applied',[eventId,hash,workspace,customer,subscription,'team',state,time,149,'brl']);
 try{expect((await apply(event,'hash','active',20)).rows[0].applied).toBe(true);expect((await apply(event,'hash','active',20)).rows[0].applied).toBe(false);expect((await apply(event+'old','old','cancelled',10)).rows[0].applied).toBe(false);expect((await call(owner,['billing'])).data).toMatchObject({subscription:{state:'active',plan:'team'}});await expect(apply(event,'changed','active',20)).rejects.toThrow('Billing event changed');await expect(call(owner,['billing','checkout'],'POST',{plan:'solo'})).rejects.toMatchObject({status:409});}
 finally{await admin.query('DELETE FROM billing_events WHERE id=ANY($1::text[])',[[event,event+'old']]);}
});
