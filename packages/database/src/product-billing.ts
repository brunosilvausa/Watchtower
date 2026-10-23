import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type pg from 'pg';
import { AccessError, getProductPool, withWorkspace, type Actor } from './product.js';
import { plans, planLimits } from './product-validation.js';
import { audit, type ProductRequest } from './product-common.js';
export function verifyBillingSignature(body: string, signature: string, secret: string, now = Date.now()): boolean {
    const fields = signature.split(',').map(x => x.split('='));
    const stamp = fields.find(x => x[0] === 't')?.[1];
    if (!stamp || Math.abs(now / 1000 - Number(stamp)) > 300)
        return false;
    const expected = createHmac('sha256', secret).update(`${stamp}.${body}`).digest();
    return fields.filter(x => x[0] === 'v1').some(x => { const hash = Buffer.from(x[1] ?? '', 'hex'); return hash.length === expected.length && timingSafeEqual(hash, expected); });
}
async function stripe(path: string, body?: URLSearchParams, idempotencyKey?: string): Promise<Record<string, unknown>> {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret)
        throw new AccessError(503, 'Stripe is not configured');
    const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${secret}`, ...idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}, ...body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {} }, body, signal: AbortSignal.timeout(10000) });
    if (!response.ok)
        throw new AccessError(502, 'Billing provider could not complete the request');
    return await response.json() as Record<string, unknown>;
}
export async function billingRequest(client: pg.PoolClient, actor: Actor, workspaceId: string, request: ProductRequest): Promise<unknown> {
    const workspace = (await client.query('SELECT name,plan FROM workspaces WHERE id=$1', [workspaceId])).rows[0];
    const subscription = (await client.query('SELECT * FROM subscriptions WHERE workspace_id=$1', [workspaceId])).rows[0] ?? { plan: 'free', state: 'free' };
    if (request.method === 'GET') {
        const count = (await client.query('SELECT count(*)::int AS count FROM monitors WHERE workspace_id=$1 AND archived_at IS NULL', [workspaceId])).rows[0].count;
        const invoices = subscription.provider_customer_id && process.env.STRIPE_SECRET_KEY ? await stripe(`invoices?customer=${encodeURIComponent(subscription.provider_customer_id)}&limit=20`) : { data: [] };
        return { plans, subscription, usage: { monitors: count, limit: planLimits(workspace.plan).monitors }, configured: Boolean(process.env.STRIPE_SECRET_KEY), invoices: invoices.data };
    }
    const origin = process.env.BETTER_AUTH_URL;
    if (!origin)
        throw new AccessError(503, 'Application URL is not configured');
    const base = new URL(origin).origin;
    if (request.path[1] === 'portal') {
        if (!subscription.provider_customer_id)
            throw new AccessError(409, 'No billing customer exists for this workspace');
        const result = await stripe('billing_portal/sessions', new URLSearchParams({ customer: subscription.provider_customer_id, return_url: `${base}/dashboard/billing` }));
        return { url: result.url };
    }
    throw new AccessError(404, 'Billing action not found');
}

type CheckoutIntent = {
  workspace_id: string; generation: string; plan: 'solo' | 'team'; idempotency_key: string;
  request_body: string; expires_at: Date; provider_session_id: string | null; provider_url: string | null; closed_at: Date | null;
};
type Subscription = { provider_subscription_id: string | null; provider_customer_id: string | null; state: string };
async function checkoutSubscription(client: pg.PoolClient, workspaceId: string): Promise<Subscription | undefined> {
  const subscription = (await client.query<Subscription>('SELECT provider_subscription_id,provider_customer_id,state FROM subscriptions WHERE workspace_id=$1',[workspaceId])).rows[0];
  if (subscription?.provider_subscription_id && !['cancelled','canceled','incomplete_expired'].includes(subscription.state)) throw new AccessError(409,'Manage the existing subscription through the billing portal');
  return subscription;
}
async function newCheckoutIntent(client: pg.PoolClient, actor: Actor, workspaceId: string, plan: 'solo' | 'team', subscription?: Subscription): Promise<CheckoutIntent> {
  const origin = process.env.BETTER_AUTH_URL, price = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
  if (!process.env.STRIPE_SECRET_KEY || !origin || !price) throw new AccessError(503,'Billing provider, application URL and price must be configured');
  const base = new URL(origin).origin, generation = randomUUID(), expires = Math.floor(Date.now()/1000)+3600;
  const body = new URLSearchParams({mode:'subscription','line_items[0][price]':price,'line_items[0][quantity]':'1',success_url:`${base}/dashboard/billing?checkout=complete`,cancel_url:`${base}/dashboard/billing`,client_reference_id:workspaceId,'subscription_data[metadata][workspace_id]':workspaceId,'subscription_data[metadata][plan]':plan,expires_at:String(expires)});
  if(subscription?.provider_customer_id) body.set('customer',subscription.provider_customer_id);
  const result = await client.query<CheckoutIntent>('INSERT INTO checkout_intents(workspace_id,generation,plan,idempotency_key,request_body,expires_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(workspace_id) DO UPDATE SET generation=EXCLUDED.generation,plan=EXCLUDED.plan,idempotency_key=EXCLUDED.idempotency_key,request_body=EXCLUDED.request_body,expires_at=EXCLUDED.expires_at,provider_session_id=NULL,provider_url=NULL,closed_at=NULL,created_at=now() RETURNING *',[workspaceId,generation,plan,`checkout:${workspaceId}:${generation}`,body.toString(),new Date(expires*1000)]);
  await audit(client,actor,workspaceId,'checkout-intent','billing',generation);
  return result.rows[0]!;
}
function checkoutSession(value: Record<string,unknown>, intent: CheckoutIntent): {id:string;url:string|null;status:'open'|'complete'|'expired';subscriptionId:string|null} {
  if(typeof value.id!=='string'||!/^cs_[A-Za-z0-9_]+$/.test(value.id)||value.client_reference_id!==intent.workspace_id||value.mode!=='subscription'||!['open','complete','expired'].includes(String(value.status))||value.expires_at!==Math.floor(intent.expires_at.getTime()/1000)) throw new AccessError(502,'Billing provider returned an invalid checkout session');
  if(intent.provider_session_id&&intent.provider_session_id!==value.id)throw new AccessError(502,'Billing session identity mismatch');
  const url = typeof value.url==='string'?value.url:null;
  if(value.status==='open'&&(!url||!url.startsWith('https://'))) throw new AccessError(502,'Billing provider returned an invalid checkout URL');
  return {id:value.id,url,status:value.status as 'open'|'complete'|'expired',subscriptionId:typeof value.subscription==='string'?value.subscription:null};
}
export async function checkoutRequest(actor: Actor, workspaceId: string, input: unknown, pool=getProductPool()): Promise<{url:string}> {
  const plan = input && typeof input==='object' && 'plan' in input ? input.plan : undefined;
  if(plan!=='solo'&&plan!=='team') throw new AccessError(400,'Choose a purchasable plan');
  for(let attempt=0;attempt<3;attempt++) {
    let priorSubscriptionId:string|undefined;
    const intent = await withWorkspace(actor,workspaceId,'billing:write',async client=>{
      const subscription=await checkoutSubscription(client,workspaceId);
      priorSubscriptionId=subscription?.provider_subscription_id??undefined;
      const existing=(await client.query<CheckoutIntent>('SELECT * FROM checkout_intents WHERE workspace_id=$1',[workspaceId])).rows[0];
      if(existing && !existing.closed_at) {
        if(existing.plan!==plan&&existing.expires_at.getTime()>Date.now())throw new AccessError(409,'A checkout for another plan is already pending');
        return existing;
      }
      return newCheckoutIntent(client,actor,workspaceId,plan,subscription);
    },pool);
    let session;
    if(!intent.provider_session_id) {
      // The persisted request and key survive timeouts; never mint another payable session on uncertainty.
      session=checkoutSession(await stripe('checkout/sessions',new URLSearchParams(intent.request_body),intent.idempotency_key),intent);
      const current=await withWorkspace(actor,workspaceId,'billing:write',async client=>{
        const result=await client.query('UPDATE checkout_intents SET provider_session_id=$3,provider_url=$4 WHERE workspace_id=$1 AND generation=$2 RETURNING generation',[workspaceId,intent.generation,session!.id,session!.status==='open'?session!.url:null]);
        await checkoutSubscription(client,workspaceId);
        return Boolean(result.rowCount);
      },pool);
      if(!current)continue;
    } else if(intent.expires_at.getTime()>Date.now()&&intent.provider_url&&!priorSubscriptionId) {
      return {url:intent.provider_url};
    } else {
      session=checkoutSession(await stripe(`checkout/sessions/${encodeURIComponent(intent.provider_session_id)}`),intent);
    }
    if(session.status==='complete') {
      await withWorkspace(actor,workspaceId,'billing:write',async client=>{
        const subscription=await checkoutSubscription(client,workspaceId);
        if(!subscription?.provider_subscription_id||subscription.provider_subscription_id!==session!.subscriptionId)throw new AccessError(409,'Checkout is complete; awaiting the subscription webhook');
        const current=(await client.query<{generation:string}>('SELECT generation FROM checkout_intents WHERE workspace_id=$1',[workspaceId])).rows[0];
        if(current?.generation===intent.generation)await newCheckoutIntent(client,actor,workspaceId,plan,subscription);
      },pool);
      continue;
    }
    if(session.status==='open') {
      if(intent.expires_at.getTime()<=Date.now())throw new AccessError(409,'The provider has not expired the previous checkout');
      return {url:session.url!};
    }
    await withWorkspace(actor,workspaceId,'billing:write',async client=>{
      const subscription=await checkoutSubscription(client,workspaceId);
      const current=(await client.query<{generation:string}>('SELECT generation FROM checkout_intents WHERE workspace_id=$1',[workspaceId])).rows[0];
      if(current?.generation===intent.generation)await newCheckoutIntent(client,actor,workspaceId,plan,subscription);
    },pool);
  }
  throw new AccessError(409,'Checkout changed concurrently; retry the request');
}

export async function closeCheckoutForDeletion(actor:Actor,workspaceId:string,pool=getProductPool()):Promise<void> {
  const state=await withWorkspace(actor,workspaceId,'workspace:delete',async client=>{
    const subscription=await checkoutSubscription(client,workspaceId);
    const intent=(await client.query<CheckoutIntent>('SELECT * FROM checkout_intents WHERE workspace_id=$1',[workspaceId])).rows[0];
    return {intent,subscription};
  },pool);
  const {intent,subscription}=state;
  if(!intent||intent.closed_at)return;
  let response=await (intent.provider_session_id?stripe(`checkout/sessions/${encodeURIComponent(intent.provider_session_id)}`):stripe('checkout/sessions',new URLSearchParams(intent.request_body),intent.idempotency_key));
  let session=checkoutSession(response,intent);
  if(session.status==='open') {
    response=await stripe(`checkout/sessions/${encodeURIComponent(session.id)}/expire`,new URLSearchParams(),`checkout-expire:${intent.generation}`);
    session=checkoutSession(response,{...intent,provider_session_id:session.id});
  }
  if(session.status==='open')throw new AccessError(409,'The provider has not cancelled the pending checkout');
  if(session.status==='complete'&&(!subscription?.provider_subscription_id||session.subscriptionId!==subscription.provider_subscription_id))throw new AccessError(409,'Checkout was completed; wait for the billing update and cancel its subscription before deletion');
  await withWorkspace(actor,workspaceId,'workspace:delete',async client=>{
    await checkoutSubscription(client,workspaceId);
    const result=await client.query('UPDATE checkout_intents SET closed_at=now(),provider_session_id=$3,provider_url=NULL WHERE workspace_id=$1 AND generation=$2 RETURNING generation',[workspaceId,intent.generation,session.id]);
    if(!result.rowCount)throw new AccessError(409,'Checkout changed during cancellation; retry deletion');
    await audit(client,actor,workspaceId,'close-checkout','billing',intent.generation);
  },pool);
}
