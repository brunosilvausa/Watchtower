import { getProductPool,tokenHash,consumeRateLimit,AccessError } from '@watchtower/database';
import { requireActor } from '@/lib/access';
import { apiError,privateJson,requestBody,requireOrigin } from '@/lib/server/http';
export async function POST(request:Request){try{requireOrigin(request);const actor=await requireActor(request.headers),body=await requestBody(request) as {token?:unknown};if(typeof body.token!=='string'||body.token.length>200)throw new AccessError(400,'Invitation token required');await consumeRateLimit(`invitation:${actor.userId}`,10,60);const result=await getProductPool().query('SELECT accept_invitation($1,$2) AS id',[tokenHash(body.token),actor.userId]);return privateJson(result.rows[0]);}catch(error){return apiError(error);}}
