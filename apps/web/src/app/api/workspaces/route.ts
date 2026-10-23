import { createWorkspace,listWorkspaces,consumeRateLimit,AccessError } from '@watchtower/database';
import { requireActor } from '@/lib/access';
import { apiError,privateJson,requestBody,requireOrigin } from '@/lib/server/http';
export async function GET(request:Request){try{return privateJson(await listWorkspaces(await requireActor(request.headers)));}catch(error){return apiError(error);}}
export async function POST(request:Request){try{requireOrigin(request);const actor=await requireActor(request.headers),body=await requestBody(request) as {name?:unknown};if(typeof body.name!=='string')throw new AccessError(400,'Workspace name is required');await consumeRateLimit(`workspace-create:${actor.userId}`,5,3600);return privateJson({id:await createWorkspace(actor,body.name)},201);}catch(error){return apiError(error);}}
