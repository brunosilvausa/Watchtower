import { withDeadline } from './deadline.js';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],
  ['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.31.196.0',24],['192.52.193.0',24],['192.175.48.0',24],['192.88.99.0',24],['192.168.0.0',16],
  ['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4],
] as const) blocked.addSubnet(address, prefix, 'ipv4');
const globalV6 = new BlockList(); globalV6.addSubnet('2000::', 3, 'ipv6');
for (const [address, prefix] of [['2001::',23],['2001:db8::',32],['2002::',16],['3fff::',20],['2620:4f:8000::',48]] as const) blocked.addSubnet(address,prefix,'ipv6');
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address, 'ipv4') : family === 6 && globalV6.check(address,'ipv6') && !blocked.check(address,'ipv6');
}
export type Resolver = (host: string) => Promise<{address: string; family: number}[]>;
export async function resolvePublic(host: string, resolver: Resolver = (name) => lookup(name,{all:true})): Promise<{address:string;family:number}> {
  const normalized = host.replace(/^\[|\]$/g, '');
  const answers = isIP(normalized) ? [{address: normalized, family:isIP(normalized)}] : await resolver(normalized);
  if (!answers.length || answers.some((entry) => !isPublicAddress(entry.address))) throw new Error('FORBIDDEN_DESTINATION');
  return answers[0]!;
}
export interface HttpResponse { status: number; body: string; headers: Record<string, string | string[] | undefined> }
export interface HttpInput { url: string; signal: AbortSignal; method?: 'GET' | 'POST'; headers?: Record<string,string>; body?: string | Buffer }
export type HttpTransport = (input: HttpInput) => Promise<HttpResponse>;
export async function safeHttp(input: HttpInput): Promise<HttpResponse> { return requestWithResolver(input,resolvePublic); }
export async function requestWithResolver(input: HttpInput, resolver: (host:string)=>Promise<{address:string;family:number}>, redirects = 0): Promise<HttpResponse> {
  const url = new URL(input.url);
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new Error('INVALID_URL');
  const pinned = await withDeadline(resolver(url.hostname),input.signal);
  input.signal.throwIfAborted();
  const response = await new Promise<HttpResponse>((resolve,reject) => {
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
      family:pinned.family, method:input.method ?? 'GET', headers: input.headers, signal:input.signal,
      lookup: (_host, _options, callback) => callback(null,pinned.address,pinned.family),
    }, (res) => {
      const chunks: Buffer[] = []; let size = 0;
      res.on('data', (chunk: Buffer) => { size += chunk.length; if (size > 1_048_576) { res.destroy(new Error('RESPONSE_TOO_LARGE')); } else chunks.push(chunk); });
      res.on('error', reject);
      res.on('end', () => resolve({status:res.statusCode ?? 0,body:Buffer.concat(chunks).toString('utf8'),headers:res.headers}));
    });
    request.on('error', reject); request.end(input.body);
  });
  if ([301,302,303,307,308].includes(response.status) && typeof response.headers.location === 'string') {
    if (redirects >= 3) throw new Error('REDIRECT_LIMIT');
    // Credentials never cross an origin or follow provider redirects.
    if (input.method === 'POST' || input.headers) throw new Error('REDIRECT_NOT_ALLOWED');
    return requestWithResolver({...input,url:new URL(response.headers.location,url).href},resolver,redirects+1);
  }
  return response;
}
