import { hydrateMonitorConfig } from './jobs-config.js';
import { randomUUID } from 'node:crypto';
import { type MonitorType } from '@watchtower/runtime';
import { z } from 'zod';
import { AccessError, getProductPool, type Actor } from './product.js';
import { newToken, tokenHash } from './product-secrets.js';
const enrollment=z.object({name:z.string().trim().min(1).max(100),region:z.string().regex(/^[a-z0-9-]{1,30}$/),capabilities:z.array(z.enum(['http','keyword','port','ping','heartbeat','ssl','domain','dns','api'])).min(1).max(9)}).strict();
export async function enrollPrivateProbe(actor:Actor,workspaceId:string,input:{name:string;region:string;capabilities:MonitorType[]}):Promise<{id:string;token:string}> {
 const value=enrollment.parse(input),id=`private-${randomUUID()}`,token=newToken('wtp_');
 await getProductPool().query('SELECT manage_private_probe($1,$2,$3,$4,$5)',[actor.userId,workspaceId,'create',id,JSON.stringify({...value,hash:tokenHash(token)})]);return {id,token};
}
export async function listPrivateProbes(actor:Actor,workspaceId:string):Promise<unknown> {return (await getProductPool().query<{data:unknown}>('SELECT manage_private_probe($1,$2,$3,$4,$5) data',[actor.userId,workspaceId,'list','',{}])).rows[0]?.data;}
export async function revokePrivateProbe(actor:Actor,workspaceId:string,id:string):Promise<void>{await getProductPool().query('SELECT manage_private_probe($1,$2,$3,$4,$5)',[actor.userId,workspaceId,'revoke',id,{}]);}
export async function handlePrivateProbe(token:string,action:string,payload:unknown):Promise<unknown>{
 if(!/^wtp_[\w-]{43}$/.test(token)||!['heartbeat','claim','complete'].includes(action))throw new AccessError(403,'Probe access denied');
 const body=action==='complete'?z.object({id:z.uuid(),leaseToken:z.uuid(),configVersion:z.number().int().positive(),result:z.object({state:z.enum(['up','down','degraded','unknown']),durationMs:z.number().min(0).max(30000).nullable(),statusCode:z.number().int().min(100).max(599).nullable(),errorCode:z.string().regex(/^[A-Z0-9_]{1,100}$/).nullable(),expiresAt:z.iso.datetime().optional(),observedAt:z.iso.datetime()}).strict()}).strict().parse(payload):{};
 const data=(await getProductPool().query<{data:unknown}>('SELECT private_probe_action($1,$2,$3) data',[tokenHash(token),action,JSON.stringify(body)])).rows[0]?.data;
 if(action==='claim' && Array.isArray(data))return data.map((claim:Record<string,unknown>)=>({...claim,config:hydrateMonitorConfig(claim.config as Parameters<typeof hydrateMonitorConfig>[0])}));
 return data;
}
