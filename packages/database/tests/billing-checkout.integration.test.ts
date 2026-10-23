import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll,afterEach,beforeAll,beforeEach,expect,it,vi } from 'vitest';
import { assertLocalTarget } from '../src/local-target.js';
import { createWorkspace,withWorkspace,type Actor } from '../src/product.js';
import { checkoutRequest } from '../src/product-billing.js';
import { deleteWorkspace } from '../src/product-public.js';
const migrationUrl=process.env.DATABASE_MIGRATION_URL??'',runtimeUrl=process.env.DATABASE_TEST_URL??'';
assertLocalTarget(migrationUrl,'watchtower_migrator');assertLocalTarget(runtimeUrl,'watchtower_app');
const admin=new pg.Pool({connectionString:migrationUrl}),runtime=new pg.Pool({connectionString:runtimeUrl});
const actor:Actor={userId:randomUUID(),sessionId:randomUUID(),platformAdmin:false,mfaVerified:false};
const workspaces:string[]=[];let workspace='';
type Session={id:string;url:string|null;status:'open'|'complete'|'expired';mode:'subscription';client_reference_id:string;expires_at:number;subscription?:string};
let sessions:Map<string,{body:string;session:Session}>;let lostResponse=false;let creates=0;let retrieves=0;let fetchCalls=0;let concurrent=false;
beforeAll(async()=>{await admin.query('INSERT INTO auth_user(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',[actor.userId,'Billing fixture',`${actor.userId}@example.test`]);await admin.query('INSERT INTO auth_session(id,"userId",token,"expiresAt") VALUES($1,$2,$3,now()+interval \'1 day\')',[actor.sessionId,actor.userId,randomUUID()]);});
beforeEach(async()=>{
  workspace=await createWorkspace(actor,'Billing checkout fixture',runtime);workspaces.push(workspace);
  sessions=new Map();lostResponse=false;creates=0;retrieves=0;fetchCalls=0;concurrent=false;
  vi.stubEnv('STRIPE_SECRET_KEY','fake-provider-never-network');vi.stubEnv('STRIPE_PRICE_SOLO','price_fixture_solo');vi.stubEnv('STRIPE_PRICE_TEAM','price_fixture_team');vi.stubEnv('BETTER_AUTH_URL','http://localhost:3137');
  vi.stubGlobal('fetch',vi.fn(async(url:unknown,init?:RequestInit)=>{
    fetchCalls++;
    // A second connection can lock the row: no checkout transaction may span provider I/O.
    const probe=await runtime.connect();try{await probe.query('BEGIN');await probe.query("SELECT set_config('app.workspace_id',$1,true)",[workspace]);if(!concurrent)await probe.query('SELECT id FROM workspaces WHERE id=$1 FOR UPDATE NOWAIT',[workspace]);expect((await probe.query('SELECT generation FROM checkout_intents WHERE workspace_id=$1',[workspace])).rowCount).toBe(1);await probe.query('COMMIT');}finally{probe.release();}
    if(init?.method==='POST'&&String(url).endsWith('/expire')) {
      const id=String(url).split('/').at(-2);const session=[...sessions.values()].find(row=>row.session.id===id)?.session;if(!session)return Response.json({}, {status:404});session.status='expired';session.url=null;return Response.json(session);
    }
    if(init?.method==='POST'){
      const key=new Headers(init.headers).get('Idempotency-Key')??'';expect(key).toContain(`checkout:${workspace}:`);
      const body=String(init.body),params=new URLSearchParams(body);let stored=sessions.get(key);
      if(stored){expect(body).toBe(stored.body);}else{creates++;stored={body,session:{id:`cs_test_${randomUUID().replaceAll('-','')}`,url:`https://checkout.stripe.com/c/pay/${creates}`,status:'open',mode:'subscription',client_reference_id:workspace,expires_at:Number(params.get('expires_at'))}};sessions.set(key,stored);}
      if(lostResponse){lostResponse=false;throw new Error('Simulated lost provider response');}
      return Response.json(stored.session);
    }
    retrieves++;const id=String(url).split('/').at(-1);const session=[...sessions.values()].find(row=>row.session.id===id)?.session;if(!session)return Response.json({}, {status:404});return Response.json(session);
  }));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();});
afterAll(async()=>{
  const client=await admin.connect();try{for(const id of workspaces){await client.query('BEGIN');await client.query("SELECT set_config('app.workspace_id',$1,true)",[id]);await client.query('DELETE FROM audit_events WHERE workspace_id=$1',[id]);await client.query('DELETE FROM subscriptions WHERE workspace_id=$1',[id]);await client.query('DELETE FROM memberships WHERE workspace_id=$1',[id]);await client.query('DELETE FROM workspaces WHERE id=$1',[id]);await client.query('COMMIT');}await client.query('DELETE FROM users WHERE id=$1',[actor.userId]);await client.query('DELETE FROM auth_user WHERE id=$1',[actor.userId]);}finally{client.release();await Promise.all([admin.end(),runtime.end()]);}
});
it('reuses one same-plan session and rejects competing plans before delayed webhooks',async()=>{
  const first=await checkoutRequest(actor,workspace,{plan:'solo'},runtime);
  expect(await checkoutRequest(actor,workspace,{plan:'solo'},runtime)).toEqual(first);
  await expect(checkoutRequest(actor,workspace,{plan:'team'},runtime)).rejects.toMatchObject({status:409});
  expect(creates).toBe(1);expect(fetchCalls).toBe(1);
});
it('concurrent same-plan requests share the generation',async()=>{
  concurrent=true;
  const results=await Promise.all([checkoutRequest(actor,workspace,{plan:'solo'},runtime),checkoutRequest(actor,workspace,{plan:'solo'},runtime)]);
  expect(results[0]).toEqual(results[1]);expect(creates).toBe(1);
});
it('concurrent competing plans permit exactly one payable session',async()=>{
  concurrent=true;
  const results=await Promise.allSettled([checkoutRequest(actor,workspace,{plan:'solo'},runtime),checkoutRequest(actor,workspace,{plan:'team'},runtime)]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  expect(results.filter(result=>result.status==='rejected')).toHaveLength(1);expect(creates).toBe(1);
});
it('lost response retries exact persisted body, expiry and key even after configuration changes',async()=>{
  lostResponse=true;await expect(checkoutRequest(actor,workspace,{plan:'solo'},runtime)).rejects.toThrow('Simulated lost');
  const original=[...sessions.entries()][0]!;
  vi.stubEnv('STRIPE_PRICE_SOLO','price_changed');vi.stubEnv('BETTER_AUTH_URL','https://changed.example');
  expect((await checkoutRequest(actor,workspace,{plan:'solo'},runtime)).url).toBe(original[1].session.url);
  expect(creates).toBe(1);expect([...sessions.keys()]).toEqual([original[0]]);
});
it('requires provider-confirmed expiry before replacing an elapsed local intent',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);
  const old=[...sessions.values()][0]!.session;
  vi.spyOn(Date,'now').mockReturnValue((old.expires_at+1)*1000);
  await expect(checkoutRequest(actor,workspace,{plan:'team'},runtime)).rejects.toMatchObject({status:409});expect(creates).toBe(1);
  old.status='expired';old.url=null;
  const replacement=await checkoutRequest(actor,workspace,{plan:'team'},runtime);
  expect(replacement.url).toBeTruthy();expect(creates).toBe(2);expect(retrieves).toBe(2);
  expect(new URLSearchParams([...sessions.values()][1]!.body).get('line_items[0][price]')).toBe('price_fixture_team');
});
it('completed checkout blocks another plan until delayed subscription webhook even past expiry',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);
  const old=[...sessions.values()][0]!.session;old.status='complete';old.url=null;
  vi.spyOn(Date,'now').mockReturnValue((old.expires_at+1)*1000);
  await expect(checkoutRequest(actor,workspace,{plan:'team'},runtime)).rejects.toMatchObject({status:409});
  await expect(checkoutRequest(actor,workspace,{plan:'solo'},runtime)).rejects.toMatchObject({status:409});expect(creates).toBe(1);
});
it('existing nonterminal subscriptions prevent provider calls and pending-session reuse',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);const calls=fetchCalls;
  await withWorkspace(actor,workspace,'billing:write',async client=>{await client.query("INSERT INTO subscriptions(workspace_id,provider_subscription_id,state,plan) VALUES($1,$2,'past_due','solo')",[workspace,`sub_${randomUUID()}`]);},runtime);
  await expect(checkoutRequest(actor,workspace,{plan:'solo'},runtime)).rejects.toMatchObject({status:409});expect(fetchCalls).toBe(calls);
});
it('unauthorized actors cannot reserve an intent or contact the provider',async()=>{
  await expect(checkoutRequest({...actor,userId:randomUUID()},workspace,{plan:'solo'},runtime)).rejects.toMatchObject({status:403});
  await expect(checkoutRequest(actor,workspace,{plan:'enterprise'},runtime)).rejects.toMatchObject({status:400});expect(fetchCalls).toBe(0);
});
it('a persisted completed response remains blocked before local expiry after restart',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);
  const session=[...sessions.values()][0]!.session;session.status='complete';session.url=null;
  await withWorkspace(actor,workspace,'billing:write',async client=>{await client.query('UPDATE checkout_intents SET provider_url=NULL WHERE workspace_id=$1',[workspace]);},runtime);
  await expect(checkoutRequest(actor,workspace,{plan:'solo'},runtime)).rejects.toMatchObject({status:409});expect(retrieves).toBe(1);expect(creates).toBe(1);
});

it('deliberate deletion expires an open checkout before suspending the workspace',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);
  await expect(deleteWorkspace(actor,workspace,'wrong',runtime)).rejects.toMatchObject({status:400});expect(fetchCalls).toBe(1);
  expect((await deleteWorkspace(actor,workspace,'Billing checkout fixture',runtime)).state).toBe('deletion-requested');
  expect([...sessions.values()][0]!.session.status).toBe('expired');
});
it('completed checkout awaiting its webhook blocks deletion without suspending workspace',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);const session=[...sessions.values()][0]!.session;session.status='complete';session.url=null;session.subscription='sub_not_received';
  await expect(deleteWorkspace(actor,workspace,'Billing checkout fixture',runtime)).rejects.toMatchObject({status:409});
  expect(await withWorkspace(actor,workspace,'read',async client=>(await client.query('SELECT suspended FROM workspaces WHERE id=$1',[workspace])).rows[0].suspended,runtime)).toBe(false);
});
it('a confirmed terminal subscription allows deletion of its completed checkout',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);const session=[...sessions.values()][0]!.session;session.status='complete';session.url=null;session.subscription=`sub_${randomUUID()}`;
  await withWorkspace(actor,workspace,'billing:write',async client=>{await client.query("INSERT INTO subscriptions(workspace_id,provider_subscription_id,state,plan) VALUES($1,$2,'canceled','solo')",[workspace,session.subscription]);},runtime);
  expect((await deleteWorkspace(actor,workspace,'Billing checkout fixture',runtime)).state).toBe('deletion-requested');
});
it('a terminal subscription permits a new purchase after reconciling its completed session',async()=>{
  await checkoutRequest(actor,workspace,{plan:'solo'},runtime);const session=[...sessions.values()][0]!.session;session.status='complete';session.url=null;session.subscription=`sub_${randomUUID()}`;
  await withWorkspace(actor,workspace,'billing:write',async client=>{await client.query("INSERT INTO subscriptions(workspace_id,provider_subscription_id,state,plan) VALUES($1,$2,'canceled','solo')",[workspace,session.subscription]);},runtime);
  expect((await checkoutRequest(actor,workspace,{plan:'solo'},runtime)).url).toBeTruthy();expect(creates).toBe(2);
});
