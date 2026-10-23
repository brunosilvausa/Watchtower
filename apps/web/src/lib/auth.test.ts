import { afterEach,expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.resetModules();});
it('imports authentication offline without starting Better Auth or opening a pool',async()=>{
  vi.stubEnv('DATABASE_URL','');vi.stubEnv('DATABASE_AUTH_URL','');vi.stubEnv('BETTER_AUTH_SECRET','');vi.stubEnv('BETTER_AUTH_URL','');
  const pg=await import('pg');const pool=vi.spyOn(pg.default,'Pool');
  const error=vi.spyOn(console,'error'),warn=vi.spyOn(console,'warn');
  const {getAuth}=await import('./auth');
  expect(error).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();expect(pool).not.toHaveBeenCalled();
  expect(()=>getAuth()).toThrow('Authentication is not configured');
  try {getAuth();}catch(failure){expect(failure).toMatchObject({status:503});}
  expect(error).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();
});
it('rejects an unsafe auth origin before library initialization',async()=>{
  vi.stubEnv('DATABASE_AUTH_URL','');vi.stubEnv('DATABASE_URL','postgresql://watchtower_app:test@127.0.0.1:55432/watchtower_dev');
  vi.stubEnv('BETTER_AUTH_SECRET','test-secret-for-config-validation-only');vi.stubEnv('BETTER_AUTH_URL','http://public.example');
  const {getAuth}=await import('./auth');expect(()=>getAuth()).toThrow('Authentication is not configured');
});
