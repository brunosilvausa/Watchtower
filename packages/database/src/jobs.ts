import pg from 'pg';
import { hydrateMonitorConfig } from './jobs-config.js';
import { databaseUrlSchema, type MonitorConfig, type MonitorType, type ProbeResult, type DeliveryJob, type DeliveryResult } from '@watchtower/runtime';
import { decryptSecret } from './product-secrets.js';
export interface ClaimedCheck { id: string; workspaceId: string; leaseToken: string; configVersion: number; workerId: string; region: string; config: MonitorConfig }
export interface ClaimedDelivery { id: string; workspaceId: string; leaseToken: string; job: DeliveryJob }
let pool: pg.Pool | undefined;
export function getWorkerPool(): pg.Pool {
  if (!pool) {
    const value=process.env.DATABASE_WORKER_URL;
    if (!databaseUrlSchema.safeParse(value).success || !value || new URL(value).username !== 'watchtower_worker') throw new Error('Invalid worker database configuration');
    pool=new pg.Pool({connectionString:value,max:4,connectionTimeoutMillis:5000,statement_timeout:10000});
    pool.on('error',() => process.stderr.write('Worker database unavailable; credentials omitted\n'));
  }
  return pool;
}
export async function closeWorkerPool(): Promise<void> {const current=pool;pool=undefined;await current?.end();}
export async function registerWorker(workerId: string, region: string, capabilities: MonitorType[], db=getWorkerPool()): Promise<boolean> {
  const result=await db.query<{enabled:boolean}>('SELECT worker_register($1,$2,$3) enabled',[workerId,region,capabilities]); return result.rows[0]?.enabled ?? false;
}
export async function claimChecks(workerId: string, region: string, limit: number, db=getWorkerPool()): Promise<ClaimedCheck[]> {
  const result=await db.query<{id:string;workspace_id:string;lease_token:string;config_version:number;config:MonitorConfig}>('SELECT * FROM worker_claim_checks($1,$2,$3)',[workerId,region,limit]);
  return result.rows.map((row) => ({id:row.id,workspaceId:row.workspace_id,leaseToken:row.lease_token,configVersion:row.config_version,workerId,region,config:hydrateMonitorConfig(row.config)}));
}
export async function completeCheck(claim: ClaimedCheck, result: ProbeResult, db=getWorkerPool()): Promise<boolean> {
  const response=await db.query<{applied:boolean}>('SELECT worker_complete_check($1,$2,$3,$4,$5,$6,$7) applied',[claim.workspaceId,claim.id,claim.leaseToken,claim.configVersion,claim.workerId,claim.region,JSON.stringify(result)]);return response.rows[0]?.applied ?? false;
}
export async function claimDeliveries(workerId:string,limit:number,db=getWorkerPool()):Promise<ClaimedDelivery[]> {
  const result=await db.query<{id:string;workspace_id:string;lease_token:string;channel:DeliveryJob['channel'];destination:string;encrypted_credentials:string|null;event:string;payload:{subject?:string;message?:string;encryptedMessage?:string};incident_id:string|null}>('SELECT * FROM worker_claim_deliveries($1,$2)',[workerId,limit]);
  return result.rows.map((row) => {
    let credentials:Record<string,string>={};let message=row.payload.message ?? '';
    // Missing/rotated encryption configuration must not leak ciphertext or create a false delivery.
    try {
      if(row.encrypted_credentials==='__SYSTEM_EMAIL__') credentials=row.channel==='sms'?{accountSid:process.env.TWILIO_ACCOUNT_SID ?? '',authToken:process.env.TWILIO_AUTH_TOKEN ?? '',from:process.env.TWILIO_FROM ?? ''}:{apiKey:process.env.RESEND_API_KEY ?? '',from:process.env.EMAIL_FROM ?? ''};
      else if(row.encrypted_credentials) credentials=decryptSecret(row.encrypted_credentials);
      if(row.channel==='webhook' && credentials.secret) credentials={signingSecret:credentials.secret};
      if(row.payload.encryptedMessage) message=decryptSecret(row.payload.encryptedMessage).message ?? '';
    } catch {credentials={};}
    return {id:row.id,workspaceId:row.workspace_id,leaseToken:row.lease_token,job:{id:row.id,channel:row.channel,destination:row.destination,credentials,event:row.event==='recovery'?'recovery':row.event==='test'?'test':row.event==='summary'?'summary':'alert',subject:row.payload.subject ?? 'Watchtower notification',message,incidentId:row.incident_id ?? undefined}};
  });
}
export async function completeDelivery(claim:ClaimedDelivery,result:DeliveryResult,db=getWorkerPool()):Promise<boolean> {
  const response=await db.query<{applied:boolean}>('SELECT worker_complete_delivery($1,$2,$3,$4,$5) applied',[claim.workspaceId,claim.id,claim.leaseToken,result.state,result.providerId ?? null]);return response.rows[0]?.applied ?? false;
}

export async function runWorkerHousekeeping(workerId:string,db=getWorkerPool()):Promise<number>{return (await db.query<{removed:number}>('SELECT worker_housekeeping($1) removed',[workerId])).rows[0]?.removed ?? 0;}
