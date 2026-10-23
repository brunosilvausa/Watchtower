import 'server-only';
import { AccessError } from '@watchtower/database';
export function apiError(error:unknown):Response {
 if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status});
 if(error&&typeof error==='object'&&'name' in error&&error.name==='ZodError')return Response.json({error:'Invalid request. Check the supplied fields.'},{status:400});
 if(error&&typeof error==='object'&&'code' in error){if(error.code==='23505')return Response.json({error:'This value already exists.'},{status:409});if(['22P02','23503','23514'].includes(String(error.code)))return Response.json({error:'Invalid resource or value.'},{status:400});}
 return Response.json({error:'The service could not complete this request.'},{status:503});
}
export function requireOrigin(request:Request):void{
 const expected=new URL(process.env.BETTER_AUTH_URL??request.url).origin;
 if(request.headers.get('origin')!==expected)throw new AccessError(403,'Request origin denied');
}
export async function requestText(request:Request):Promise<string>{
 const reader=request.body?.getReader();if(!reader)return "";let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw new AccessError(413,'Request too large');}chunks.push(value);}}finally{reader.releaseLock();}
 return Buffer.concat(chunks).toString('utf8');
}
export async function requestBody(request:Request):Promise<unknown>{
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AccessError(415,'JSON required');
 const text = await requestText(request);
 try{return text ? JSON.parse(text) as unknown : {};}catch{throw new AccessError(400,'Invalid JSON');}
}
export function privateJson(data:unknown,status=200){return Response.json({data},{status,headers:{'Cache-Control':'private, no-store'}});}
