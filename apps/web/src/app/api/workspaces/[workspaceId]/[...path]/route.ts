import { handleWorkspaceRequest,consumeRateLimit,type ProductRequest } from '@watchtower/database';
import { requireActor } from '@/lib/access';
import { apiError,privateJson,requestBody,requireOrigin } from '@/lib/server/http';
async function handle(request:Request,context:{params:Promise<{workspaceId:string;path:string[]}>}){
 try{const method=request.method as ProductRequest['method'];if(method!=='GET')requireOrigin(request);const actor=await requireActor(request.headers),params=await context.params;if(method!=='GET')await consumeRateLimit(`mutation:${actor.userId}:${params.workspaceId}`,60,60);
 const range=new URL(request.url).searchParams.get('range');const response=await handleWorkspaceRequest(actor,params.workspaceId,{method,path:params.path,body:method==='GET'||method==='DELETE'?{}:await requestBody(request),range:range==='24h'||range==='30d'?range:'7d'});return privateJson(response.data,response.status);
 }catch(error){return apiError(error);}
}
export {handle as GET,handle as POST,handle as PATCH,handle as DELETE};
