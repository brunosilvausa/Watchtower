import { handlePublicStatus } from '@watchtower/database';
import { apiError,requestBody,privateJson } from '@/lib/server/http';
async function handle(request:Request,context:{params:Promise<{slug:string}>}) {
  try { const {slug}=await context.params;const body=request.method==='POST'?await requestBody(request) as {password?:string}:{};
    return privateJson(await handlePublicStatus(slug,{action:'read',password:body.password}));
  } catch(error) {return apiError(error);}
}
export {handle as GET,handle as POST};
