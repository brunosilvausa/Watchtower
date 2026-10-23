import { AccessError,consumeRateLimit,getProductPool,tokenHash,handleWorkspaceRequest,type ProductRequest } from '@watchtower/database';
import { apiError,privateJson,requestBody } from '@/lib/server/http';
async function handle(request:Request,context:{params:Promise<{path:string[]}>}){
 try{const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token||token.length>200)throw new AccessError(401,'API key required');const key=(await getProductPool().query('SELECT * FROM resolve_product_key($1)',[tokenHash(token)])).rows[0];if(!key)throw new AccessError(401,'Invalid API key');await consumeRateLimit(`api:${tokenHash(token)}`,120,60);const {path}=await context.params;
 if(!['monitors','incidents','maintenance'].includes(path[0]??''))throw new AccessError(404,'API resource not found');
 const scope=request.method==='GET'?'read':path[0]==='maintenance'?'maintenance':'write';if(!(key.scopes as string[]).includes(scope))throw new AccessError(403,'API key scope denied');
 const result=await handleWorkspaceRequest({userId:key.user_id,sessionId:'api-key',platformAdmin:false,mfaVerified:false},key.workspace_id,{path,method:request.method as ProductRequest['method'],body:['GET','DELETE'].includes(request.method)?{}:await requestBody(request)});return privateJson(result.data,result.status);
 }catch(error){return apiError(error);}
}
export {handle as GET,handle as POST,handle as PATCH,handle as DELETE};
