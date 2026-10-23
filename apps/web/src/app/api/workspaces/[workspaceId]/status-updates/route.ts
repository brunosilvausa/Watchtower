import { publishStatusUpdate,AccessError } from '@watchtower/database';
import { requireActor } from '@/lib/access';
import { apiError,requestBody,privateJson,requireOrigin } from '@/lib/server/http';
export async function POST(request:Request,context:{params:Promise<{workspaceId:string}>}) {try{requireOrigin(request);const actor=await requireActor(request.headers);const {workspaceId}=await context.params;const body=await requestBody(request) as {pageId?:string;title?:string;body?:string};if(typeof body.pageId!=='string')throw new AccessError(400,'Page required');return privateJson(await publishStatusUpdate(actor,workspaceId,body.pageId,{title:body.title,body:body.body}),201);}catch(error){return apiError(error);}}
