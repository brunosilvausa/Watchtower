import { expect,it } from 'vitest';
import { createPrivateProbeExecutor } from './private.js';
it('requires a bounded private CIDR allowlist and never admits loopback/metadata',async()=>{
 for(const cidrs of [[],['0.0.0.0/0'],['10.0.0.0/0'],['127.0.0.0/8'],['169.254.0.0/16'],['fc00::/0'],['8.8.8.0/24']])expect(()=>createPrivateProbeExecutor(cidrs)).toThrow();
 const execute=createPrivateProbeExecutor(['10.1.0.0/16','fd12::/32']);
 for(const target of ['http://127.0.0.1','http://169.254.169.254','http://192.168.1.1','http://[::1]'])expect((await execute({type:'http',target},AbortSignal.timeout(1000))).errorCode).toBe('FORBIDDEN_DESTINATION');
});
