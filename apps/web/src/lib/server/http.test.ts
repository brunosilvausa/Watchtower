import { expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { requestText } from './http';
it('preserves exact signed body bytes and cancels oversized streams without buffering them',async()=>{
 const text=' {"name":"ação"}\n';expect(await requestText(new Request('https://example.com',{method:'POST',body:text}))).toBe(text);
 const cancel=vi.fn();const body=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(65537));},cancel});
 const request=new Request('https://example.com',{method:'POST',body,duplex:'half'} as RequestInit);
 await expect(requestText(request)).rejects.toMatchObject({status:413});expect(cancel).toHaveBeenCalledOnce();
});
