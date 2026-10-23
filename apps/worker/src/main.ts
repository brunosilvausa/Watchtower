import { hostname } from 'node:os';
import { createLogger, processMetrics, executeProbe, deliverNotification, type MonitorType } from '@watchtower/runtime';
import { claimChecks, completeCheck, claimDeliveries, completeDelivery, registerWorker, closeWorkerPool, runWorkerHousekeeping, purgeDeletedWorkspaces, getWorkerPool } from '@watchtower/database';
const logger=createLogger('worker');
const sample=() => logger.info({event:'process_metrics',...processMetrics()},'Process resources');
const heartbeat=setInterval(sample,60000);
const controller=new AbortController();
let timer:ReturnType<typeof setTimeout> | undefined;
let running:Promise<void> | undefined;
let housekeepingAt=0;
const workerId=process.env.WATCHTOWER_WORKER_ID ?? `local-${hostname().replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,60)}-${process.pid}`;
const region=process.env.WATCHTOWER_REGION ?? 'local';
const capabilities:MonitorType[]=['http','keyword','port','heartbeat','ssl','domain','dns','api'];
if(process.env.WATCHTOWER_ICMP_ENABLED==='true') capabilities.push('ping');
async function tick():Promise<void> {
  try {
    if(!await registerWorker(workerId,region,capabilities)) return;
    if(Date.now()-housekeepingAt>60000){await runWorkerHousekeeping(workerId);await purgeDeletedWorkspaces(getWorkerPool());housekeepingAt=Date.now();}
    const checks=await claimChecks(workerId,region,4);
    await Promise.all(checks.map(async claim => {
      const result=await executeProbe(claim.config,controller.signal);
      if(!controller.signal.aborted) await completeCheck(claim,result);
    }));
    if(controller.signal.aborted) return;
    const deliveries=await claimDeliveries(workerId,4);
    await Promise.all(deliveries.map(async claim => {const result=await deliverNotification(claim.job);await completeDelivery(claim,result);}));
    logger.info({event:'worker_batch',checks:checks.length,deliveries:deliveries.length},'Worker batch completed');
  } catch {logger.error({event:'worker_batch_failed'},'Worker batch failed; credentials omitted');}
}
function schedule():void {
  if(controller.signal.aborted) return;
  running=tick().finally(() => {if(!controller.signal.aborted) timer=setTimeout(schedule,1000);});
}
async function stop(signal:NodeJS.Signals):Promise<void> {
  clearInterval(heartbeat);if(timer)clearTimeout(timer);controller.abort();
  await running;await closeWorkerPool();
  logger.info({event:'worker_stopped',signal},'Worker stopped');
}
process.once('SIGTERM',() => {void stop('SIGTERM');});process.once('SIGINT',() => {void stop('SIGINT');});
const enabled=process.env.WATCHTOWER_WORKER_ENABLED==='true';
logger.info({event:'worker_started',mode:enabled?'active':'foundation',region},enabled?'Worker ready':'Worker ready; job execution disabled');sample();
if(enabled)schedule();
