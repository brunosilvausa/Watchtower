import { safeHttp, type HttpTransport } from './probes/network.js';
import { providerRequest } from './providers/payloads.js';
import type { DeliveryJob } from './monitor-types.js';
export type { DeliveryJob, ChannelType } from './monitor-types.js';
export interface DeliveryResult { state: 'accepted' | 'unconfigured' | 'retry' | 'failed'; providerId?: string }
export async function deliverNotification(job: DeliveryJob): Promise<DeliveryResult> {return deliverWithTransport(job,safeHttp);}
export async function deliverWithTransport(job: DeliveryJob, transport: HttpTransport): Promise<DeliveryResult> {
  if (!job.destination || !job.id || job.message.length > 16000 || job.subject.length > 1024) return {state:'failed'};
  try {
    const request=providerRequest(job);
    if (!request) return {state:'unconfigured'};
    if (new URL(request.url).protocol !== 'https:') return {state:'failed'};
    const response=await transport({...request,method:'POST',signal:AbortSignal.timeout(15000)});
    if (response.status === 429 || response.status >= 500) return {state:'retry'};
    if (response.status < 200 || response.status >= 300) return {state:'failed'};
    // Acceptance is not proof that the recipient received a notification.
    return {state:'accepted'};
  } catch(error) {
    const code=error instanceof Error && 'code' in error ? String(error.code) : '';
    return {state:['ECONNRESET','ETIMEDOUT','ECONNREFUSED','EAI_AGAIN','ABORT_ERR'].includes(code) || (error instanceof Error && error.name === 'TimeoutError') ? 'retry' : 'failed'};
  }
}
