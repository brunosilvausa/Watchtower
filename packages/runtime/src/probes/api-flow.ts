import type { ApiStep } from '../monitor-types.js';
import type { HttpTransport } from './network.js';
const forbidden = new Set(['__proto__','prototype','constructor']);
function substitute(value: string, variables: Map<string,string>): string {
  return value.replace(/\{\{([a-zA-Z][a-zA-Z0-9_]{0,31})\}\}/g,(_match,name: string) => {
    const replacement=variables.get(name); if (replacement === undefined) throw new Error('INVALID_EXTRACTION'); return replacement;
  });
}
export async function runApiFlow(steps: ApiStep[], signal: AbortSignal, transport: HttpTransport): Promise<{state:'up'|'down';statusCode:number}> {
  if (!steps.length || steps.length > 5) throw new Error('INVALID_STEPS');
  const variables=new Map<string,string>();
  const origin = new URL(steps[0]!.url).origin;
  let statusCode=0;
  for (const step of steps) {
    // Extracted secrets stay in headers/body, never URLs or another origin.
    if (step.url.includes('{{') || new URL(step.url).origin !== origin) throw new Error('INVALID_STEPS');
    const headers: Record<string,string> = {};
    for (const [name,value] of Object.entries(step.headers ?? {})) {
      if (!/^(authorization|content-type|accept|x-[a-z0-9-]+)$/i.test(name)) throw new Error('INVALID_STEPS');
      headers[name]=substitute(value,variables);
      if (headers[name]!.length > 8192 || /[\r\n]/.test(headers[name]!)) throw new Error('INVALID_STEPS');
    }
    const body = step.body === undefined ? undefined : substitute(step.body,variables);
    if (body && Buffer.byteLength(body) > 65536) throw new Error('INVALID_STEPS');
    if (step.method && !['GET','POST'].includes(step.method)) throw new Error('INVALID_STEPS');
    if ((body || Object.keys(headers).length) && new URL(step.url).protocol !== 'https:') throw new Error('INVALID_STEPS');
    const response=await transport({url:step.url,method:step.method ?? 'GET',headers,body,signal}); statusCode=response.status;
    if (statusCode !== (step.expectedStatus ?? 200) || (step.contains !== undefined && !response.body.includes(step.contains))) return {state:'down',statusCode};
    if ((step.extract?.length ?? 0) > 8) throw new Error('INVALID_EXTRACTION');
    for (const extraction of step.extract ?? []) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(extraction.name) || !extraction.path.length || extraction.path.length > 8) throw new Error('INVALID_EXTRACTION');
      let value: unknown = JSON.parse(response.body);
      for (const key of extraction.path) {
        if (forbidden.has(key) || !value || typeof value !== 'object' || !Object.hasOwn(value,key)) throw new Error('INVALID_EXTRACTION');
        value=(value as Record<string,unknown>)[key];
      }
      if ((typeof value !== 'string' && typeof value !== 'number') || String(value).length > 8192) throw new Error('INVALID_EXTRACTION');
      variables.set(extraction.name,String(value));
    }
  }
  return {state:'up',statusCode};
}
