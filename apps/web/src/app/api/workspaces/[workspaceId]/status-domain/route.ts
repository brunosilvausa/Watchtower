import { statusDomain,AccessError } from '@watchtower/database';
import { requireActor } from '@/lib/access';
import { apiError,requestBody,privateJson,requireOrigin } from '@/lib/server/http';
export async function POST(request:Request,context:{params:Promise<{workspaceId:string}>}) {try{requireOrigin(request);const actor=await requireActor(request.headers);const {workspaceId}=await context.params;const body=await requestBody(request) as {pageId?:string;action?:string};if(typeof body.pageId!=='string'||!['challenge','verify'].includes(body.action??''))throw new AccessError(400,'Page and action required');return privateJson(await statusDomain(actor,workspaceId,body.pageId,body.action as 'challenge'|'verify'));}catch(error){return apiError(error);}}
