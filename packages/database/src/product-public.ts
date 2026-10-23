import { Resolver } from 'node:dns/promises';
import { z } from 'zod';
import { AccessError, getProductPool, withWorkspace, type Actor } from './product.js';
import { encryptSecret, newToken, tokenHash, verifyPagePassword } from './product-secrets.js';
import { audit, found } from './product-common.js';
import type pg from 'pg';
import { closeCheckoutForDeletion } from './product-billing.js';
export async function consumeRateLimit(key: string, maximum: number, windowSeconds: number, pool = getProductPool()): Promise<void> {
  const result = await pool.query<{allowed:boolean}>('SELECT consume_public_limit($1,$2,$3) allowed',[tokenHash(key),maximum,windowSeconds]);
  if (!result.rows[0]?.allowed) throw new AccessError(429,'Too many requests. Try again later.');
}
export async function readPublicStatus(slug: string, password?: string, pool = getProductPool()): Promise<Record<string,unknown>> {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new AccessError(404,'Status page unavailable');
  await consumeRateLimit(`status:${slug}`,500,60,pool);
  const page = (await pool.query<{data:Record<string,unknown>|null}>('SELECT read_status_page($1) data',[slug])).rows[0]?.data;
  if (!page) throw new AccessError(404,'Status page unavailable');
  if (page.passwordHash && (!password || password.length>128 || !await verifyPagePassword(password,String(page.passwordHash)))) throw new AccessError(401,'Password required');
  delete page.passwordHash;
  return page;
}
export async function handlePublicStatus(slug: string, request: { action:'read'|'subscribe'|'verify'|'unsubscribe'; password?:string; email?:string; token?:string }, pool = getProductPool()): Promise<Record<string,unknown>> {
  if(request.action==='verify'||request.action==='unsubscribe') {
    if (!request.token || request.token.length>200) throw new AccessError(400,'Invalid subscription link');
    await consumeRateLimit(`status-link:${slug}`,30,60,pool);
    const result = await pool.query<{success:boolean}>('SELECT public_status_action($1,$2,$3) success',[slug,request.action,JSON.stringify({hash:tokenHash(request.token)})]);
    if(!result.rows[0]?.success) throw new AccessError(400,'Subscription link is expired or unavailable');
    return {state:request.action==='verify'?'verified':'unsubscribed'};
  }
  const page = await readPublicStatus(slug,request.password,pool);
  if(request.action==='read') { await pool.query("SELECT public_status_action($1,'view','{}')",[slug]); return page; }
  const email = z.email().max(254).parse(request.email).toLowerCase();
  await consumeRateLimit(`subscribe:${slug}:${email}`,3,3600,pool);
  await consumeRateLimit(`subscribe:${slug}`,20,3600,pool);
  const origin = process.env.BETTER_AUTH_URL;
  if(!origin) throw new AccessError(503,'Public site URL is not configured');
  const token = newToken('sub_');
  const url = new URL(`/status/${slug}`,origin);url.searchParams.set('verify',token);
  const encryptedMessage=encryptSecret({message:`Confirm your Watchtower status subscription: ${url.toString()}\n\nUnsubscribe: ${new URL(`/status/${slug}?unsubscribe=${encodeURIComponent(token)}`,origin).toString()}`});
  await pool.query("SELECT public_status_action($1,'subscribe',$2)",[slug,JSON.stringify({email,hash:tokenHash(token),notification:{destination:email,subject:`Confirm ${String(page.name)} status subscription`,encryptedMessage}})]);
  return {state:'verification-pending'};
}
export async function resolveStatusDomain(hostname: string, pool = getProductPool()): Promise<string|null> {
  const host=hostname.toLowerCase().replace(/\.$/,'');
  if(!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) return null;
  return (await pool.query<{slug:string|null}>('SELECT resolve_status_domain($1) slug',[host])).rows[0]?.slug??null;
}
export async function statusDomain(actor:Actor,workspaceId:string,pageId:string,action:'challenge'|'verify',pool=getProductPool()):Promise<Record<string,unknown>> {
  const page = await withWorkspace(actor,workspaceId,'workspace:admin',async client=>{
    const row = found((await client.query<{id:string;custom_domain:string|null;domain_challenge:string|null}>('SELECT id,custom_domain,domain_challenge FROM status_pages WHERE workspace_id=$1 AND id=$2',[workspaceId,pageId])).rows[0]);
    if(!row.custom_domain)throw new AccessError(400,'Set a custom domain first');
    if(action==='challenge') { const challenge=newToken('verify_'); await client.query('UPDATE status_pages SET domain_challenge=$3,domain_verified_at=NULL WHERE workspace_id=$1 AND id=$2',[workspaceId,pageId,challenge]); return {...row,domain_challenge:challenge}; }
    return row;
  },pool);
  const record=`_watchtower.${page.custom_domain}`;
  if(action==='challenge') return {record,type:'TXT',value:`watchtower-site-verification=${page.domain_challenge}`};
  if(!page.domain_challenge) throw new AccessError(400,'Generate a domain verification challenge first');
  const resolver=new Resolver({timeout:3000,tries:1});
  let records:string[][]=[];try {records=await resolver.resolveTxt(record);}catch {throw new AccessError(409,'Verification TXT record was not found');}
  if(!records.some(parts=>parts.join('')===`watchtower-site-verification=${page.domain_challenge}`))throw new AccessError(409,'Verification TXT record does not match');
  return withWorkspace(actor,workspaceId,'workspace:admin',async client=>{
    const updated=await client.query('UPDATE status_pages SET domain_verified_at=now() WHERE workspace_id=$1 AND id=$2 AND custom_domain=$3 AND domain_challenge=$4 RETURNING id',[workspaceId,pageId,page.custom_domain,page.domain_challenge]);
    if(!updated.rowCount)throw new AccessError(409,'Domain configuration changed');
    await audit(client,actor,workspaceId,'verify-domain','status-page',pageId);return {state:'verified',domain:page.custom_domain};
  },pool);
}
export async function publishStatusUpdate(actor:Actor,workspaceId:string,pageId:string,input:unknown,pool=getProductPool()):Promise<unknown> {
  const value=z.object({title:z.string().trim().min(1).max(150),body:z.string().trim().min(1).max(5000)}).strict().parse(input);
  return withWorkspace(actor,workspaceId,'workspace:admin',async client=>{
    found((await client.query('SELECT id FROM status_pages WHERE workspace_id=$1 AND id=$2',[workspaceId,pageId])).rows[0]);
    const update=(await client.query<{id:string}>('INSERT INTO status_updates(workspace_id,page_id,title,body) VALUES($1,$2,$3,$4) RETURNING id',[workspaceId,pageId,value.title,value.body])).rows[0]!;
    const subscribers=await client.query<{id:string;email:string}>('SELECT id,email FROM status_subscribers WHERE workspace_id=$1 AND page_id=$2 AND verified_at IS NOT NULL',[workspaceId,pageId]);
    for(const subscriber of subscribers.rows) await client.query("INSERT INTO notification_outbox(workspace_id,event,payload,idempotency_key) VALUES($1,'status-update',$2,$3)",[workspaceId,JSON.stringify({destination:subscriber.email,subject:value.title,encryptedMessage:encryptSecret({message:value.body})}),`status:${update.id}:${subscriber.id}`]);
    await audit(client,actor,workspaceId,'publish-update','status-page',pageId);return update;
  },pool);
}
async function validateDeletion(client:pg.PoolClient,actor:Actor,workspaceId:string,confirmation:string):Promise<void> {
    const session=await client.query('SELECT id FROM auth_session WHERE id=$1 AND "userId"=$2 AND "createdAt">now()-interval \'10 minutes\' AND "expiresAt">now()',[actor.sessionId,actor.userId]);
    if(!session.rowCount)throw new AccessError(403,'Sign in again before deleting a workspace');
    const workspace=found((await client.query<{name:string}>('SELECT name FROM workspaces WHERE id=$1',[workspaceId])).rows[0]);
    if(confirmation!==workspace.name)throw new AccessError(400,'Confirm the exact workspace name');
    if ((await client.query("SELECT workspace_id FROM subscriptions WHERE workspace_id=$1 AND state NOT IN ('cancelled','canceled','incomplete_expired','free') AND provider_subscription_id IS NOT NULL",[workspaceId])).rowCount) throw new AccessError(409,'Cancel the paid subscription before requesting deletion');
}
export async function deleteWorkspace(actor:Actor,workspaceId:string,confirmation:string,pool=getProductPool()):Promise<{state:'deletion-requested';retentionDays:number}> {
  await withWorkspace(actor,workspaceId,'workspace:delete',client=>validateDeletion(client,actor,workspaceId,confirmation),pool);
  await closeCheckoutForDeletion(actor,workspaceId,pool);
  return withWorkspace(actor,workspaceId,'workspace:delete',async(client:pg.PoolClient)=>{
    await validateDeletion(client,actor,workspaceId,confirmation);
    if((await client.query('SELECT generation FROM checkout_intents WHERE workspace_id=$1 AND closed_at IS NULL',[workspaceId])).rowCount)throw new AccessError(409,'A checkout started during deletion; retry the request');
    await audit(client,actor,workspaceId,'request-deletion','workspace',workspaceId);
    await client.query("UPDATE workspaces SET suspended=true,settings=settings||jsonb_build_object('deletionRequestedAt',now(),'deletionRequestedBy',$2::text,'deletionPausedMonitorIds',(SELECT coalesce(jsonb_agg(id),'[]'::jsonb) FROM monitors WHERE workspace_id=$1 AND NOT paused)) WHERE id=$1",[workspaceId,actor.userId]);
    await client.query('UPDATE monitors SET paused=true,lease_token=NULL,lease_until=NULL WHERE workspace_id=$1',[workspaceId]);
    return {state:'deletion-requested',retentionDays:30};
  },pool);
}
