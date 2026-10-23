import { expect,it } from 'vitest';
import { hydrateMonitorConfig } from './jobs-config.js';
import { encryptSecret } from './product-secrets.js';
it('hydrates encrypted steps only for a worker and reports missing key explicitly',()=>{
 const previous=process.env.PRODUCT_ENCRYPTION_KEY;process.env.PRODUCT_ENCRYPTION_KEY='ab'.repeat(32);
 try{
  const encryptedSteps=encryptSecret({steps:JSON.stringify([{url:'https://example.com',headers:{Authorization:'Bearer secret'}}])});
  const config=hydrateMonitorConfig({type:'api',target:'https://example.com',encryptedSteps});
  expect(config.steps?.[0]?.headers?.Authorization).toBe('Bearer secret');expect(config).not.toHaveProperty('encryptedSteps');
  delete process.env.PRODUCT_ENCRYPTION_KEY;
  expect(hydrateMonitorConfig({type:'api',target:'https://example.com',encryptedSteps})).toEqual({type:'api',target:'https://example.com',configurationError:'CREDENTIALS_UNCONFIGURED'});
 }finally{if(previous===undefined)delete process.env.PRODUCT_ENCRYPTION_KEY;else process.env.PRODUCT_ENCRYPTION_KEY=previous;}
});
