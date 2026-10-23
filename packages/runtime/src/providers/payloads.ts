import webPush from 'web-push';
import { createHmac } from 'node:crypto';
import type { DeliveryJob } from '../monitor-types.js';
export interface ProviderRequest { url: string; headers: Record<string,string>; body: string | Buffer }
const json = (url: string, body: unknown, headers: Record<string,string> = {}): ProviderRequest => ({url,body:JSON.stringify(body),headers:{'Content-Type':'application/json',...headers}});
function required(job: DeliveryJob, ...keys: string[]): boolean {return keys.every((key) => Boolean(job.credentials[key]?.trim()));}
function xml(value: string): string {return value.replace(/[<>&"']/g,(char) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));}
export function providerRequest(job: DeliveryJob): ProviderRequest | null {
  const credentials=job.credentials;
  switch(job.channel) {
    case 'email': return required(job,'apiKey','from') ? json('https://api.resend.com/emails',{from:credentials.from,to:[job.destination],subject:job.subject,text:job.message},{Authorization:`Bearer ${credentials.apiKey}`,'Idempotency-Key':job.id}) : null;
    case 'sms': case 'voice': case 'whatsapp': {
      if (!required(job,'accountSid','authToken','from')) return null;
      if (!/^AC[a-fA-F0-9]{32}$/.test(credentials.accountSid!)) throw new Error('INVALID_CREDENTIALS');
      const body = new URLSearchParams({To:job.channel === 'whatsapp' ? `whatsapp:${job.destination}` : job.destination,From:job.channel === 'whatsapp' ? `whatsapp:${credentials.from}` : credentials.from!});
      if (job.channel === 'voice') body.set('Twiml',`<Response><Say>${xml(job.message)}</Say></Response>`); else body.set('Body',job.message);
      return {url:`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/${job.channel === 'voice' ? 'Calls' : 'Messages'}.json`,body:body.toString(),headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:`Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64')}`}};
    }
    case 'slack': return required(job,'webhookUrl') ? json(credentials.webhookUrl!,{text:`${job.subject}\n${job.message}`}) : null;
    case 'teams': return required(job,'webhookUrl') ? json(credentials.webhookUrl!,{type:'message',attachments:[{contentType:'application/vnd.microsoft.card.adaptive',contentUrl:null,content:{$schema:'http://adaptivecards.io/schemas/adaptive-card.json',type:'AdaptiveCard',version:'1.2',body:[{type:'TextBlock',text:job.subject,weight:'Bolder'},{type:'TextBlock',text:job.message,wrap:true}]}}]}) : null;
    case 'discord': return required(job,'webhookUrl') ? json(credentials.webhookUrl!,{content:`${job.subject}\n${job.message}`,allowed_mentions:{parse:[]}}) : null;
    case 'telegram': {
      if (!required(job,'botToken')) return null;
      if (!/^\d+:[\w-]+$/.test(credentials.botToken!)) throw new Error('INVALID_CREDENTIALS');
      return json(`https://api.telegram.org/bot${credentials.botToken}/sendMessage`,{chat_id:job.destination,text:`${job.subject}\n${job.message}`});
    }
    case 'pagerduty': return required(job,'routingKey') ? json('https://events.pagerduty.com/v2/enqueue',{routing_key:credentials.routingKey,event_action:job.event === 'recovery' ? 'resolve' : 'trigger',dedup_key:job.incidentId ?? job.id,payload:{summary:job.subject,source:'Watchtower',severity:'error',custom_details:{message:job.message}}}) : null;
    case 'opsgenie': {
      if (!required(job,'apiKey')) return null;
      const alias=job.incidentId ?? job.id;
      return json(job.event === 'recovery' ? `https://api.opsgenie.com/v2/alerts/${encodeURIComponent(alias)}/close?identifierType=alias` : 'https://api.opsgenie.com/v2/alerts',job.event === 'recovery' ? {source:'Watchtower',note:job.message} : {message:job.subject,alias,description:job.message,source:'Watchtower'},{Authorization:`GenieKey ${credentials.apiKey}`});
    }
    case 'webhook': {
      if (!required(job,'signingSecret')) return null;
      const body=JSON.stringify({id:job.id,event:job.event,subject:job.subject,message:job.message,incidentId:job.incidentId});
      return {url:job.destination,body,headers:{'Content-Type':'application/json','X-Watchtower-Event':job.id,'X-Watchtower-Signature':`sha256=${createHmac('sha256',credentials.signingSecret!).update(body).digest('hex')}`}};
    }
    case 'push': {
      if (!required(job,'p256dh','auth','vapidSubject','vapidPublicKey','vapidPrivateKey')) return null;
      const request = webPush.generateRequestDetails({endpoint:job.destination,keys:{p256dh:credentials.p256dh!,auth:credentials.auth!}},JSON.stringify({title:job.subject,body:job.message,id:job.id}),{TTL:3600,contentEncoding:'aes128gcm',vapidDetails:{subject:credentials.vapidSubject!,publicKey:credentials.vapidPublicKey!,privateKey:credentials.vapidPrivateKey!}});
      return {url:request.endpoint,body:request.body ?? '',headers:Object.fromEntries(Object.entries(request.headers).map(([name,value]) => [name,String(value)]))};
    }
  }
}
