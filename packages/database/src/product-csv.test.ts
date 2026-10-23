import { expect,it } from 'vitest';
import { parseMonitorCsv } from './product-csv.js';
import { verifyBillingSignature } from './product-billing.js';
import { createHmac } from 'node:crypto';
it('imports quoted commas and rejects malformed rows atomically',()=>{expect(parseMonitorCsv('name,url,interval\r\n"A, B",https://example.com,300')[0]?.name).toBe('A, B');expect(()=>parseMonitorCsv('name,url,interval\n"unfinished')).toThrow();expect(()=>parseMonitorCsv('wrong,url,interval\na,b,300')).toThrow();});
it('verifies billing signatures and rejects replay windows or tampering',()=>{const time=1792700000,body='{}',secret='test';const sig=createHmac('sha256',secret).update(`${time}.${body}`).digest('hex');expect(verifyBillingSignature(body,`t=${time},v1=${sig}`,secret,time*1000)).toBe(true);expect(verifyBillingSignature('tampered',`t=${time},v1=${sig}`,secret,time*1000)).toBe(false);expect(verifyBillingSignature(body,`t=${time},v1=${sig}`,secret,(time+301)*1000)).toBe(false);});
