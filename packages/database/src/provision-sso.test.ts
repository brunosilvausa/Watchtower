import { expect,it,vi } from 'vitest';
import { provisionLocalSso } from './provision-sso.js';
it('rejects remote administrative targets before DNS or database access',async()=>{
  const dns=vi.fn();
  await expect(provisionLocalSso('postgresql://watchtower_migrator:secret@remote.example/watchtower',{},dns)).rejects.toThrow('Expected local');
  expect(dns).not.toHaveBeenCalled();
});
it('rejects unbounded/invalid SAML configuration without DNS or database access',async()=>{
  const dns=vi.fn();
  await expect(provisionLocalSso('postgresql://watchtower_migrator:local@127.0.0.1:55432/watchtower_dev',{providerId:'fixture',domain:'example.test',ownerEmail:'owner@example.test',issuer:'urn:test',entryPoint:'http://example.test',idpEntityId:'urn:idp',certificate:'invalid'},dns)).rejects.toThrow();
  expect(dns).not.toHaveBeenCalled();
});
