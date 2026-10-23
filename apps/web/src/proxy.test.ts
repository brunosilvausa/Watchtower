import { afterEach,expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks=vi.hoisted(()=>({resolve:vi.fn()}));
vi.mock('@watchtower/database',()=>({resolveStatusDomain:mocks.resolve}));
import { proxy } from './proxy';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('serves only verified custom hosts through their own published status slug',async()=>{vi.stubEnv('BETTER_AUTH_URL','https://app.example.com');mocks.resolve.mockResolvedValue('customer-status');const response=await proxy(new NextRequest('https://status.customer.com/'));expect(response.headers.get('x-middleware-rewrite')).toBe('https://status.customer.com/status/customer-status');mocks.resolve.mockResolvedValue(null);expect((await proxy(new NextRequest('https://unverified.example.com/'))).status).toBe(404);});
it('keeps the app hostname and offline foundation independent of database',async()=>{vi.stubEnv('BETTER_AUTH_URL','https://app.example.com');await proxy(new NextRequest('https://app.example.com/'));vi.stubEnv('BETTER_AUTH_URL','');await proxy(new NextRequest('http://127.0.0.1/'));expect(mocks.resolve).not.toHaveBeenCalled();});

it('recognizes the validated loopback host when Next normalizes its URL',async()=>{vi.stubEnv('BETTER_AUTH_URL','http://127.0.0.1:3137');const response=await proxy(new NextRequest('http://localhost:3137/',{headers:{host:'127.0.0.1:3137'}}));expect(response.headers.get('x-middleware-next')).toBe('1');expect(mocks.resolve).not.toHaveBeenCalled();});
