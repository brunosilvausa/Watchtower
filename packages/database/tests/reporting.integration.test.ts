import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll,beforeAll,expect,it } from 'vitest';
import { assertLocalTarget } from '../src/local-target.js';
import { withWorkspace,createWorkspace,type Actor } from '../src/product.js';
import { dashboard } from '../src/product-dashboard.js';
const adminUrl=process.env.DATABASE_MIGRATION_URL ?? '',appUrl=process.env.DATABASE_TEST_URL ?? '';
assertLocalTarget(adminUrl,'watchtower_migrator');assertLocalTarget(appUrl,'watchtower_app');
const admin=new pg.Pool({connectionString:adminUrl}),app=new pg.Pool({connectionString:appUrl});
const actor:Actor={userId:randomUUID(),sessionId:randomUUID(),platformAdmin:true,mfaVerified:true};
const tenants:string[]=[];const monitor=randomUUID(),status=randomUUID(),flag=`fixture-${randomUUID()}`;const slug=`report-${randomUUID()}`;
let baseline: {metrics:{mrr:{currency:string;monthlyAmount:number}[];queue:{state:string;count:number}[]}};
async function scoped<T>(operation:(client:pg.PoolClient)=>Promise<T>,tenant=tenants[0]!):Promise<T>{return withWorkspace(actor,tenant,'read',operation,app);}
beforeAll(async()=>{
 await admin.query('INSERT INTO auth_user(id,name,email,"emailVerified","platformAdmin") VALUES($1,$2,$3,true,true)',[actor.userId,'Reporting fixture',`${actor.userId}@example.test`]);
 baseline=(await app.query('SELECT platform_snapshot($1) data',[actor.userId])).rows[0].data;
 for(let index=0;index<3;index++)tenants.push(await createWorkspace(actor,'Reporting fixture',app));
 await scoped(async client=>{
  await client.query("INSERT INTO monitors(id,workspace_id,name,type,target,created_at,interval_seconds,config) VALUES($1,$2,'Certificate','ssl','https://example.test',now()-interval '1 day',300,'{\"regions\":[\"observed\",\"missing\"]}')",[monitor,tenants[0]]);
  await client.query("INSERT INTO check_results(workspace_id,monitor_id,state,raw_state,duration_ms,region,expires_at,observed_at) VALUES($1,$2,'up','up',123,'observed',now()+interval '20 days',now()-interval '5 minutes')",[tenants[0],monitor]);
  await client.query("INSERT INTO incidents(workspace_id,monitor_id,title,opened_at) VALUES($1,$2,'Old still open',now()-interval '2 days')",[tenants[0],monitor]);
  await client.query("INSERT INTO status_pages(id,workspace_id,name,slug,published,config) VALUES($1,$2,'Fixture',$3,true,'{\"showResponseTime\":true}')",[status,tenants[0],slug]);
  await client.query('INSERT INTO status_components(workspace_id,page_id,monitor_id) VALUES($1,$2,$3)',[tenants[0],status,monitor]);
  await client.query("INSERT INTO notification_outbox(workspace_id,event,idempotency_key) VALUES($1,'test',$2)",[tenants[0],randomUUID()]);
 });
 for(const [index,currency,amount,state] of [[0,'usd',12.5,'active'],[1,'eur',30,'active'],[2,'usd',100,'cancelled']] as const)await scoped(client=>client.query('INSERT INTO subscriptions(workspace_id,plan,state,monthly_amount,currency) VALUES($1,$2,$3,$4,$5)',[tenants[index],'solo',state,amount,currency]),tenants[index]);
});
afterAll(async()=>{
 await admin.query('DELETE FROM feature_flags WHERE key=$1',[flag]);
 for(const tenant of tenants){const client=await admin.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[tenant]);for(const table of ['notification_outbox','status_components','status_pages','incident_events','incidents','check_results','monitors','subscriptions','memberships'])await client.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[tenant]);await client.query('DELETE FROM workspaces WHERE id=$1',[tenant]);await client.query('COMMIT');}finally{client.release();}}
 await admin.query('DELETE FROM users WHERE id=$1',[actor.userId]);await admin.query('DELETE FROM auth_user WHERE id=$1',[actor.userId]);await Promise.all([admin.end(),app.end()]);
});
it('reports current incidents, real expiry, measured regions and missing observation denominator',async()=>{
 const data=await scoped(client=>dashboard(client,tenants[0]!,actor.userId,'24h'));
 expect(data.summary.openIncidents).toBe(1);expect(data.summary.uptime).toBe(100);expect(data.summary.observedChecks).toBe(1);expect(data.summary.expectedChecks).toBeGreaterThanOrEqual(576);expect(data.summary.coveragePercent).toBeLessThan(1);
 expect(data.expiries[0]).toMatchObject({id:monitor,type:'ssl',region:'observed'});expect(data.expiries[0].daysRemaining).toBeGreaterThanOrEqual(19);
 expect(data.regions.find(region=>region.region==='missing')).toMatchObject({checks:0,observedChecks:0,coveragePercent:0,lastObservedAt:null,uptime:null});
});
it('public response metric honors showResponseTime without exposing secrets',async()=>{
 const read=async()=>((await app.query('SELECT read_status_page($1) data',[slug])).rows[0].data as {components:{duration_ms:number|null;observed_at:string}[]});
 expect((await read()).components[0]?.duration_ms).toBe(123);expect((await read()).components[0]?.observed_at).toBeTruthy();
 await scoped(client=>client.query("UPDATE status_pages SET config='{\"showResponseTime\":false}' WHERE id=$1",[status]));expect((await read()).components[0]?.duration_ms).toBeNull();
});
it('platform groups actual recurring revenue by currency and reports actual queue with insufficient churn history',async()=>{
 const data=(await app.query('SELECT platform_snapshot($1) data',[actor.userId])).rows[0].data as {metrics:{mrr:{currency:string;monthlyAmount:number}[];churn:{state:string;ratePercent:number|null};queue:{state:string;count:number}[]}};
 for(const [currency,added] of [['USD',12.5],['EUR',30]] as const){const before=baseline.metrics.mrr.find(row=>row.currency===currency)?.monthlyAmount??0;expect(data.metrics.mrr.find(row=>row.currency===currency)?.monthlyAmount).toBe(before+added);}
 expect(data.metrics.churn).toMatchObject({state:'insufficient_history',ratePercent:null});
 expect(data.metrics.queue.find(row=>row.state==='pending')?.count).toBe((baseline.metrics.queue.find(row=>row.state==='pending')?.count??0)+1);
});
it('creates a new flag with validated tenant targeting and rejects nonexistent targets',async()=>{
 await app.query('SELECT platform_mutation($1,$2,$3,$4)',[actor.userId,'flag',flag,{enabled:true,rollout:25,workspaceIds:[tenants[0],tenants[1]]}]);
 const value=(await admin.query('SELECT * FROM feature_flags WHERE key=$1',[flag])).rows[0];expect(value.enabled).toBe(true);expect(value.rollout).toBe(25);expect(value.workspace_ids.sort()).toEqual(tenants.slice(0,2).sort());
 await expect(app.query('SELECT platform_mutation($1,$2,$3,$4)',[actor.userId,'flag',flag,{enabled:false,rollout:10,workspaceIds:[randomUUID()]}])).rejects.toThrow('Target workspace unavailable');
 expect((await admin.query('SELECT enabled FROM feature_flags WHERE key=$1',[flag])).rows[0].enabled).toBe(true);
});
it('churn denominator is the start-of-window paid cohort, excluding new cancellations and reactivations',async()=>{
 const client=await admin.connect();
 try{
  await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[tenants[0]]);
  await client.query('DELETE FROM subscription_state_history WHERE workspace_id=$1',[tenants[0]]);
  await client.query("INSERT INTO subscription_state_history(workspace_id,state,observed_at) VALUES($1,'active',now()-interval '10 days'),($1,'cancelled',now()-interval '1 day')",[tenants[0]]);
  expect((await client.query("SELECT * FROM workspace_churn_cohort(now()-interval '30 days')")).rows[0]).toEqual({active_at_start:0,cancelled:0});
  await client.query("INSERT INTO subscription_state_history(workspace_id,state,observed_at) VALUES($1,'active',now()-interval '31 days')",[tenants[0]]);
  expect((await client.query("SELECT * FROM workspace_churn_cohort(now()-interval '30 days')")).rows[0]).toEqual({active_at_start:1,cancelled:1});
  await client.query("INSERT INTO subscription_state_history(workspace_id,state,observed_at) VALUES($1,'active',now())",[tenants[0]]);
  expect((await client.query("SELECT * FROM workspace_churn_cohort(now()-interval '30 days')")).rows[0]).toEqual({active_at_start:1,cancelled:0});
  await client.query('ROLLBACK');
 }finally{client.release();}
});
