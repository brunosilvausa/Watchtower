import { EventEmitter } from 'node:events';
import { describe, expect, it, vi, beforeEach } from 'vitest';
const fixtures=vi.hoisted(() => ({lookup:vi.fn(),request:vi.fn(),responses:[] as {status:number;location?:string;body?:string}[],pins:[] as string[]}));
vi.mock('node:dns/promises',() => ({lookup:fixtures.lookup}));
vi.mock('node:https',() => ({request:fixtures.request}));
vi.mock('node:http',() => ({request:fixtures.request}));
import { safeHttp } from './network.js';
beforeEach(() => {
  fixtures.lookup.mockReset(); fixtures.request.mockReset(); fixtures.responses=[]; fixtures.pins=[];
  fixtures.lookup.mockResolvedValue([{address:'8.8.8.8',family:4}]);
  fixtures.request.mockImplementation((_url: URL, options: {lookup: (host:string,opts:unknown,callback:(error:unknown,address:string,family:number) => void) => void}, onResponse:(response:EventEmitter) => void) => {
    options.lookup('example.com',{},(_error,address) => fixtures.pins.push(address));
    const request=new EventEmitter() as EventEmitter & {end:() => void};
    request.end=() => {const fixture=fixtures.responses.shift() ?? {status:200}; const response=Object.assign(new EventEmitter(),{statusCode:fixture.status,headers:fixture.location ? {location:fixture.location} : {}}); onResponse(response); queueMicrotask(() => {response.emit('data',Buffer.from(fixture.body ?? 'ok')); response.emit('end');});};
    return request;
  });
});
describe('socket destination fencing',() => {
  it('rejects mixed answers before opening any socket',async () => {
    fixtures.lookup.mockResolvedValue([{address:'8.8.8.8',family:4},{address:'10.0.0.1',family:4}]);
    await expect(safeHttp({url:'https://example.com',signal:AbortSignal.timeout(1000)})).rejects.toThrow('FORBIDDEN_DESTINATION');
    expect(fixtures.request).not.toHaveBeenCalled();
  });
  it('pins the validated answer without resolving again at socket time',async () => {
    fixtures.lookup.mockResolvedValueOnce([{address:'8.8.8.8',family:4}]).mockResolvedValueOnce([{address:'127.0.0.1',family:4}]);
    await safeHttp({url:'https://example.com',signal:AbortSignal.timeout(1000)});
    expect(fixtures.pins).toEqual(['8.8.8.8']); expect(fixtures.lookup).toHaveBeenCalledOnce();
  });
  it('rejects private redirect with no second socket',async () => {
    fixtures.responses.push({status:302,location:'http://169.254.169.254/latest/meta-data'});
    await expect(safeHttp({url:'https://example.com',signal:AbortSignal.timeout(1000)})).rejects.toThrow('FORBIDDEN_DESTINATION');
    expect(fixtures.request).toHaveBeenCalledOnce();
  });
  it('revalidates same-host redirects against rebinding',async () => {
    fixtures.responses.push({status:302,location:'/next'});
    fixtures.lookup.mockResolvedValueOnce([{address:'8.8.8.8',family:4}]).mockResolvedValueOnce([{address:'127.0.0.1',family:4}]);
    await expect(safeHttp({url:'https://example.com',signal:AbortSignal.timeout(1000)})).rejects.toThrow('FORBIDDEN_DESTINATION');
    expect(fixtures.request).toHaveBeenCalledOnce();
  });
  it('never forwards authorization on redirects',async () => {
    fixtures.responses.push({status:302,location:'https://other.example.com'});
    await expect(safeHttp({url:'https://example.com',headers:{Authorization:'secret'},signal:AbortSignal.timeout(1000)})).rejects.toThrow('REDIRECT_NOT_ALLOWED');
    expect(fixtures.request).toHaveBeenCalledOnce();
  });
});
