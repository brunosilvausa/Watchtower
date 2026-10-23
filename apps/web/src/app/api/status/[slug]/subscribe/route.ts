import { handlePublicStatus } from '@watchtower/database';
import { apiError,requestBody,privateJson,requireOrigin } from '@/lib/server/http';
export async function POST(request:Request,context:{params:Promise<{slug:string}>}) {try {requireOrigin(request);const {slug}=await context.params;const body=await requestBody(request) as {email?:string;password?:string};return privateJson(await handlePublicStatus(slug,{action:'subscribe',email:body.email,password:body.password}),202);}catch(error){return apiError(error);}}
