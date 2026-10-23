import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';
import { apiError } from '@/lib/server/http';
async function handle(request: Request) {
  try {
    const handlers = toNextJsHandler(getAuth());
    return await (request.method === 'GET' ? handlers.GET(request) : handlers.POST(request));
  } catch (error) { return apiError(error); }
}
export { handle as GET, handle as POST };
