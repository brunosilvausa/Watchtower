import { withDeadline } from './probes/deadline.js';
import { runApiFlow } from './probes/api-flow.js';
import { safeHttp, type HttpTransport } from './probes/network.js';
import { dnsProbe, pingProbe, socketProbe } from './probes/protocols.js';
import type { MonitorConfig, ProbeResult } from './monitor-types.js';
export type { MonitorConfig, ProbeResult, ApiStep, MonitorType } from './monitor-types.js';
export interface ProbeDependencies {
  http: HttpTransport; socket: typeof socketProbe; dns: typeof dnsProbe; ping: typeof pingProbe; now: () => Date;
}
const defaults: ProbeDependencies = {http:safeHttp,socket:socketProbe,dns:dnsProbe,ping:pingProbe,now:() => new Date()};
function hostname(target: string): string {
  if (target.includes('://')) return new URL(target).hostname;
  if (!/^[a-zA-Z0-9.:[\]-]+$/.test(target) || target.length > 253) throw new Error('INVALID_TARGET');
  return target;
}
function expiryState(expiry: Date, now: Date, days: number): ProbeResult['state'] {
  const remaining = expiry.getTime() - now.getTime();
  return remaining <= 0 ? 'down' : remaining < days * 86400000 ? 'degraded' : 'up';
}
export async function executeProbe(config: MonitorConfig, signal: AbortSignal): Promise<ProbeResult> { return runProbe(config,signal,defaults); }
/** Dependency injection is for controlled protocol tests, never customer configuration. */
export async function runProbe(config: MonitorConfig, signal: AbortSignal, deps: ProbeDependencies): Promise<ProbeResult> {
  const observedAt = deps.now(); const started = performance.now();
  const result: ProbeResult = {state:'unknown',durationMs:null,statusCode:null,errorCode:null,observedAt};
  if(config.configurationError)return {...result,errorCode:config.configurationError};
  const timeout = config.timeoutMs ?? 10000;
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30000) return {...result,errorCode:'INVALID_TIMEOUT'};
  const bounded = AbortSignal.any([signal,AbortSignal.timeout(timeout)]);
  try {
    bounded.throwIfAborted();
    switch(config.type) {
      case 'http': case 'keyword': {
        const response = await deps.http({url:config.target,signal:bounded}); result.statusCode=response.status;
        result.state = response.status === (config.expectedStatus ?? 200) ? 'up' : 'down';
        if (config.type === 'keyword') {
          if (!config.keyword) throw new Error('INVALID_KEYWORD');
          if (response.body.includes(config.keyword) === Boolean(config.keywordAbsent)) result.state='down';
        }
        break;
      }
      case 'port': case 'ssl': {
        const port = config.port ?? (config.type === 'ssl' ? 443 : 0);
        if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('INVALID_PORT');
        const expiry = await deps.socket(hostname(config.target),port,bounded,config.type === 'ssl');
        if (expiry) { result.expiresAt=expiry; result.state=expiryState(expiry,observedAt,config.expiryWarningDays ?? 30); }
        else result.state='up';
        break;
      }
      case 'ping': await deps.ping(hostname(config.target),bounded); result.state='up'; break;
      case 'heartbeat': {
        const seen = config.heartbeatLastSeenAt ? new Date(config.heartbeatLastSeenAt).getTime() : NaN;
        const interval = config.heartbeatIntervalSeconds ?? 300; const grace = config.heartbeatGraceSeconds ?? 60;
        if (interval <= 0 || grace < 0 || !Number.isFinite(interval + grace)) throw new Error('INVALID_HEARTBEAT');
        result.state = !Number.isFinite(seen) ? 'unknown' : observedAt.getTime()-seen > (interval+grace)*1000 ? 'down' : 'up';
        if (!Number.isFinite(seen)) result.errorCode='NO_HEARTBEAT';
        break;
      }
      case 'dns': {
        const records = await withDeadline(deps.dns(hostname(config.target),config.dnsRecord ?? 'A'),bounded); bounded.throwIfAborted();
        result.state = records.length && (!config.expectedValue || records.includes(config.expectedValue)) ? 'up' : 'down'; break;
      }
      case 'domain': {
        const domain = hostname(config.target).toLowerCase();
        if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) throw new Error('INVALID_DOMAIN');
        const bootstrap = await deps.http({url:'https://data.iana.org/rdap/dns.json',signal:bounded});
        if (bootstrap.status !== 200) throw new Error('RDAP_UNAVAILABLE');
        const data: unknown = JSON.parse(bootstrap.body);
        const services = (data as {services?: unknown}).services;
        if (!Array.isArray(services)) throw new Error('INVALID_RDAP');
        const tld = domain.split('.').at(-1);
        const service = services.find((entry: unknown) => Array.isArray(entry) && Array.isArray(entry[0]) && entry[0].includes(tld)) as unknown[] | undefined;
        const endpoint = Array.isArray(service?.[1]) ? service[1][0] as unknown : undefined;
        if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) throw new Error('RDAP_UNAVAILABLE');
        const response = await deps.http({url:new URL(`domain/${encodeURIComponent(domain)}`,endpoint).href,signal:bounded});
        if (response.status !== 200) throw new Error('RDAP_UNAVAILABLE');
        const record: unknown = JSON.parse(response.body);
        const events = (record as {events?: unknown}).events;
        const event = Array.isArray(events) ? events.find((item: unknown) => typeof item === 'object' && item !== null && 'eventAction' in item && item.eventAction === 'expiration') as {eventDate?:string} | undefined : undefined;
        const expiry = new Date(event?.eventDate ?? '');
        if (!Number.isFinite(expiry.getTime())) throw new Error('RDAP_EXPIRY_UNKNOWN');
        result.expiresAt=expiry; result.state=expiryState(expiry,observedAt,config.expiryWarningDays ?? 30); break;
      }
      case 'api': {
        const flow=await runApiFlow(config.steps ?? [],bounded,deps.http);
        result.state=flow.state; result.statusCode=flow.statusCode;
        break;
      }
      default: throw new Error('UNSUPPORTED_TYPE');
    }
  } catch(error) {
    const safeCodes = new Set(['ICMP_UNCONFIGURED','RDAP_UNAVAILABLE','RDAP_EXPIRY_UNKNOWN','FORBIDDEN_DESTINATION','INVALID_TIMEOUT','INVALID_PORT','INVALID_STEPS','INVALID_TARGET','INVALID_KEYWORD','INVALID_DOMAIN','INVALID_HEARTBEAT','INVALID_RDAP','RESPONSE_TOO_LARGE','REDIRECT_LIMIT','INVALID_URL','INVALID_EXTRACTION']);
    const code = error instanceof Error && safeCodes.has(error.message) ? error.message : bounded.aborted ? 'TIMEOUT_OR_ABORT' : 'PROBE_FAILED';
    result.errorCode=code; result.state=['ICMP_UNCONFIGURED','RDAP_UNAVAILABLE','RDAP_EXPIRY_UNKNOWN'].includes(code) ? 'unknown' : 'down';
  }
  result.durationMs=Math.max(0,Math.round(performance.now()-started)); return result;
}
