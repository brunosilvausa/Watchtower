import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { isPublicAddress, requestWithResolver } from './network.js';
import { dnsProbe, pingProbe, socketProbe } from './protocols.js';
import { runProbe } from '../probes.js';
import type { MonitorConfig, ProbeResult } from '../monitor-types.js';
const privateRanges=new BlockList();
privateRanges.addSubnet('10.0.0.0',8);privateRanges.addSubnet('172.16.0.0',12);privateRanges.addSubnet('192.168.0.0',16);privateRanges.addSubnet('fc00::',7,'ipv6');
/** This factory runs only in an enrolled, workspace-owned agent; public workers never call it. */
export function createPrivateProbeExecutor(cidrs:string[]):(config:MonitorConfig,signal:AbortSignal)=>Promise<ProbeResult> {
 if(!cidrs.length || cidrs.length>32)throw new Error('PRIVATE_CIDRS_REQUIRED');
 const allowed=new BlockList();
 for(const cidr of cidrs){
  const [address,prefixText]=cidr.split('/');const family=isIP(address ?? '');const prefix=Number(prefixText);
  if(!address || !prefixText || !Number.isInteger(prefix) || (family!==4 && family!==6) || prefix<0 || prefix>(family===4?32:128) || !privateRanges.check(address,family===4?'ipv4':'ipv6'))throw new Error('INVALID_PRIVATE_CIDR');
  // Bound the complete CIDR to RFC1918/ULA, never merely its first address.
  if(family===4 && prefix<(address.startsWith('10.')?8:address.startsWith('172.')?12:16) || family===6 && prefix<7)throw new Error('INVALID_PRIVATE_CIDR');
  allowed.addSubnet(address,prefix,family===4?'ipv4':'ipv6');
 }
 const resolve=async(host:string)=>{
  const normalized=host.replace(/^\[|\]$/g,'');const family=isIP(normalized);
  const answers=family?[{address:normalized,family}]:await lookup(normalized,{all:true});
  if(!answers.length || answers.some(entry=>!isPublicAddress(entry.address)&&!allowed.check(entry.address,entry.family===4?'ipv4':'ipv6')))throw new Error('FORBIDDEN_DESTINATION');
  return answers[0]!;
 };
 return (config,signal)=>runProbe(config,signal,{http:input=>requestWithResolver(input,resolve),socket:(host,port,abort,tls)=>socketProbe(host,port,abort,tls,resolve),ping:(host,abort)=>pingProbe(host,abort,resolve),dns:dnsProbe,now:()=>new Date()});
}
