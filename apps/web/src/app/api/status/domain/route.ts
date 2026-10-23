import { resolveStatusDomain,consumeRateLimit } from '@watchtower/database';
import { apiError,privateJson } from '@/lib/server/http';
export async function GET(request:Request){try{await consumeRateLimit('status-domain-resolution',200,60);const hostname=new URL(request.url).searchParams.get('hostname')??'';return privateJson({slug:await resolveStatusDomain(hostname)});}catch(error){return apiError(error);}}
