import { createHmac,randomInt,timingSafeEqual } from 'node:crypto';
import type pg from 'pg';
import { AccessError,getProductPool,withWorkspace,type Actor } from './product.js';
import { consumeRateLimit } from './product-public.js';
import { encryptSecret,newToken } from './product-secrets.js';
function codeHash(userId:string,code:string):string {
  const key=process.env.PRODUCT_ENCRYPTION_KEY;
  if(!key||!/^[a-f0-9]{64}$/i.test(key))throw new AccessError(503,'Phone verification encryption is not configured');
  return createHmac('sha256',Buffer.from(key,'hex')).update(`${userId}:${code}`).digest('hex');
}
export async function requestPhoneVerification(actor:Actor,workspaceId:string,phone:string,pool=getProductPool()):Promise<{state:'queued'}> {
  if(!/^\+[1-9]\d{7,14}$/.test(phone))throw new AccessError(400,'Use an international E.164 phone number');
  if(!process.env.TWILIO_ACCOUNT_SID||!process.env.TWILIO_AUTH_TOKEN||!process.env.TWILIO_FROM)throw new AccessError(503,'SMS verification provider is not configured');
  await consumeRateLimit(`phone:${actor.userId}`,3,3600,pool);
  return withWorkspace(actor,workspaceId,'read',async client=>{
    const code=String(randomInt(0,1000000)).padStart(6,'0');
    await client.query("INSERT INTO phone_challenges(user_id,phone,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET phone=EXCLUDED.phone,code_hash=EXCLUDED.code_hash,attempts=0,expires_at=EXCLUDED.expires_at",[actor.userId,phone,codeHash(actor.userId,code)]);
    await client.query("INSERT INTO notification_outbox(workspace_id,event,payload,idempotency_key) VALUES($1,'phone-verification',$2,$3)",[workspaceId,JSON.stringify({destination:phone,subject:'Watchtower verification',encryptedMessage:encryptSecret({message:`Your Watchtower verification code is ${code}. It expires in 10 minutes.`})}),newToken('phone_')]);
    return {state:'queued'};
  },pool);
}
export async function verifyPhone(actor:Actor,code:string,pool=getProductPool()):Promise<{state:'verified';phone:string}> {
  if(!/^\d{6}$/.test(code))throw new AccessError(400,'Enter a six-digit verification code');
  await consumeRateLimit(`phone-check:${actor.userId}`,10,600,pool);
  const client=await pool.connect();let valid=false;let phone='';
  try {await client.query('BEGIN');
    const row=(await client.query<{phone:string;code_hash:string;attempts:number;expires_at:Date}>('SELECT * FROM phone_challenges WHERE user_id=$1 FOR UPDATE',[actor.userId])).rows[0];
    if(row&&row.attempts<5&&row.expires_at.getTime()>Date.now()){
      const actual=Buffer.from(codeHash(actor.userId,code),'hex'),expected=Buffer.from(row.code_hash,'hex');
      valid=actual.length===expected.length&&timingSafeEqual(actual,expected);
      await client.query('UPDATE phone_challenges SET attempts=attempts+1 WHERE user_id=$1',[actor.userId]);
      if(valid){phone=row.phone;await client.query('INSERT INTO user_preferences(user_id,phone,phone_verified_at) VALUES($1,$2,now()) ON CONFLICT(user_id) DO UPDATE SET phone=EXCLUDED.phone,phone_verified_at=EXCLUDED.phone_verified_at',[actor.userId,phone]);await client.query('DELETE FROM phone_challenges WHERE user_id=$1',[actor.userId]);}
    }
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  if(!valid)throw new AccessError(400,'Verification code is invalid or expired');return {state:'verified',phone};
}
export async function cancelWorkspaceDeletion(actor:Actor,workspaceId:string,pool=getProductPool()):Promise<{state:'restored'}> {
  const result=await pool.query<{restored:boolean}>('SELECT cancel_workspace_deletion($1,$2,$3) restored',[actor.userId,actor.sessionId,workspaceId]);
  if(!result.rows[0]?.restored)throw new AccessError(409,'No pending deletion to cancel');return {state:'restored'};
}
export async function purgeDeletedWorkspaces(pool:pg.Pool,workspaceId?:string):Promise<number> {
  return (await pool.query<{count:number}>('SELECT worker_purge_deleted_workspaces($1) count',[workspaceId??null])).rows[0]?.count??0;
}
