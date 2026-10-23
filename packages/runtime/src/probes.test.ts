import { describe, expect, it, vi } from 'vitest';
import { runProbe, type ProbeDependencies } from './probes.js';
import { isPublicAddress, resolvePublic } from './probes/network.js';
import { runApiFlow } from './probes/api-flow.js';
const signal = new AbortController().signal;
const now=new Date('2026-10-22T12:00:00Z');
function dependencies(): ProbeDependencies {return {
  now:() => now,http:vi.fn(async () => ({status:200,body:'healthy',headers:{}})),
  socket:vi.fn(async () => null),dns:vi.fn(async () => ['93.184.216.34']),ping:vi.fn(async () => {}),
};}
describe('public network destination policy',() => {
  it.each(['0.0.0.0','10.0.0.1','100.100.100.200','127.0.0.1','169.254.169.254','172.16.0.1','192.168.1.2','192.0.2.1','198.18.1.1','224.0.0.1','255.255.255.255','::','::1','::ffff:8.8.8.8','64:ff9b::808:808','fc00::1','fe80::1','2001:db8::1','2002:808:808::','3fff::1'])('blocks %s',(ip) => expect(isPublicAddress(ip)).toBe(false));
  it.each(['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])('permits global %s',(ip) => expect(isPublicAddress(ip)).toBe(true));
  it('rejects mixed DNS and returns the validated numeric address for pinning',async () => {
    await expect(resolvePublic('example.com',async () => [{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}])).rejects.toThrow('FORBIDDEN_DESTINATION');
    const resolver=vi.fn(async () => [{address:'8.8.8.8',family:4}]);
    expect(await resolvePublic('example.com',resolver)).toEqual({address:'8.8.8.8',family:4}); expect(resolver).toHaveBeenCalledTimes(1);
  });
});
describe('nine probe protocols',() => {
  it('checks status and keyword semantics',async () => {
    const deps=dependencies();
    expect((await runProbe({type:'http',target:'https://example.com'},signal,deps)).state).toBe('up');
    expect((await runProbe({type:'http',target:'https://example.com',expectedStatus:204},signal,deps)).state).toBe('down');
    expect((await runProbe({type:'keyword',target:'https://example.com',keyword:'healthy'},signal,deps)).state).toBe('up');
    expect((await runProbe({type:'keyword',target:'https://example.com',keyword:'healthy',keywordAbsent:true},signal,deps)).state).toBe('down');
  });
  it('does TCP, distinct ICMP, and reports absent ICMP capability',async () => {
    const deps=dependencies();
    expect((await runProbe({type:'port',target:'example.com',port:443},signal,deps)).state).toBe('up');
    expect(deps.socket).toHaveBeenCalledWith('example.com',443,expect.any(AbortSignal),false);
    expect((await runProbe({type:'ping',target:'example.com'},signal,deps)).state).toBe('up');
    deps.ping=async () => {throw new Error('ICMP_UNCONFIGURED');};
    expect((await runProbe({type:'ping',target:'example.com'},signal,deps)).state).toBe('unknown');
  });
  it('uses heartbeat grace and never fabricates first observation',async () => {
    const config={type:'heartbeat' as const,target:'',heartbeatIntervalSeconds:60,heartbeatGraceSeconds:30};
    expect((await runProbe(config,signal,dependencies())).state).toBe('unknown');
    expect((await runProbe({...config,heartbeatLastSeenAt:'2026-10-22T11:58:30Z'},signal,dependencies())).state).toBe('up');
    expect((await runProbe({...config,heartbeatLastSeenAt:'2026-10-22T11:58:29Z'},signal,dependencies())).state).toBe('down');
  });
  it('reports certificate expiry and DNS mismatch',async () => {
    const deps=dependencies(); deps.socket=async () => new Date('2026-10-25');
    expect((await runProbe({type:'ssl',target:'example.com'},signal,deps)).state).toBe('degraded');
    expect((await runProbe({type:'dns',target:'example.com',expectedValue:'1.1.1.1'},signal,deps)).state).toBe('down');
  });
  it('discovers RDAP through IANA and parses expiration',async () => {
    const deps=dependencies(); deps.http=vi.fn(async ({url}) => ({status:200,headers:{},body:JSON.stringify(url.includes('iana.org') ? {services:[[['com'],['https://rdap.example.com/']]]} : {events:[{eventAction:'expiration',eventDate:'2027-12-01'}]})}));
    const result=await runProbe({type:'domain',target:'example.com'},signal,deps);
    expect(result.state).toBe('up'); expect(result.expiresAt).toEqual(new Date('2027-12-01'));
  });
  it('bounds API steps, short-circuits failures and redacts upstream errors',async () => {
    const deps=dependencies();
    expect((await runProbe({type:'api',target:'',steps:[{url:'https://example.com',contains:'missing'}]},signal,deps)).state).toBe('down');
    expect((await runProbe({type:'api',target:'',steps:[]},signal,deps)).errorCode).toBe('INVALID_STEPS');
    deps.http=async () => {throw new Error('password=supersecret');};
    const result=await runProbe({type:'http',target:'https://example.com'},signal,deps);
    expect(JSON.stringify(result)).not.toContain('supersecret'); expect(result.errorCode).toBe('PROBE_FAILED');
  });
  it('extracts login tokens only into same-origin subsequent headers',async () => {
    const transport=vi.fn(async () => ({status:200,headers:{},body:'{"token":"secret"}'}));
    const result=await runApiFlow([{url:'https://example.com/login',method:'POST',body:'{}',extract:[{name:'token',path:['token']}]},{url:'https://example.com/me',headers:{Authorization:'Bearer {{token}}'}}],signal,transport);
    expect(result.state).toBe('up'); expect(transport.mock.calls[1]?.[0]).toMatchObject({headers:{Authorization:'Bearer secret'}});
    await expect(runApiFlow([{url:'https://example.com/a'},{url:'https://other.com/b'}],signal,transport)).rejects.toThrow('INVALID_STEPS');
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});
