import { getProductPool,tokenHash,consumeRateLimit } from '@watchtower/database';
import { apiError } from '@/lib/server/http';
export async function POST(_request:Request,context:{params:Promise<{token:string}>}){try{const {token}=await context.params;if(token.length>100)return new Response(null,{status:404});await consumeRateLimit(`heartbeat:${tokenHash(token)}`,120,60);const result=await getProductPool().query('SELECT receive_heartbeat($1) AS accepted',[tokenHash(token)]);return new Response(null,{status:result.rows[0]?.accepted?204:404});}catch(error){return apiError(error);}}
