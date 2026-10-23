import { createLogger, createPrivateProbeExecutor } from '@watchtower/runtime';
import type { MonitorConfig } from '@watchtower/runtime';
const logger=createLogger('private-probe');
const base=process.env.WATCHTOWER_CONTROL_URL ?? '',token=process.env.WATCHTOWER_PROBE_TOKEN ?? '';
const url=new URL(base);
if(url.protocol!=='https:'||url.username||url.password||!/^wtp_[\w-]{43}$/.test(token))throw new Error('Invalid private probe configuration');
const execute=createPrivateProbeExecutor((process.env.WATCHTOWER_PRIVATE_CIDRS ?? '').split(',').map(value=>value.trim()).filter(Boolean));
const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
async function request(action:string,payload:unknown):Promise<unknown>{
 const response=await fetch(new URL(`/api/probes/${action}`,url),{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]),redirect:'error'});
 if(!response.ok)throw new Error('CONTROL_REQUEST_FAILED');return response.json();
}
async function tick():Promise<void>{
 try{
  await request('heartbeat',{});
  const data=await request('claim',{});
  if(!Array.isArray(data)||data.length>3)throw new Error('INVALID_CLAIMS');
  await Promise.all(data.map(async(raw:unknown)=>{
   const claim=raw as {id:string;lease_token:string;config_version:number;config:MonitorConfig};
   const result=await execute(claim.config,controller.signal);
   if(!controller.signal.aborted)await request('complete',{id:claim.id,leaseToken:claim.lease_token,configVersion:claim.config_version,result});
  }));
 }catch{if(!controller.signal.aborted)logger.error({event:'private_probe_batch_failed'},'Private probe batch failed; credentials omitted');}
 finally{if(!controller.signal.aborted)timer=setTimeout(()=>{void tick();},5000);}
}
function stop(){controller.abort();if(timer)clearTimeout(timer);logger.info({event:'private_probe_stopped'},'Private probe stopped');}
process.once('SIGTERM',stop);process.once('SIGINT',stop);
logger.info({event:'private_probe_started'},'Workspace private probe started');void tick();
