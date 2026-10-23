import { createECDH, randomBytes, createHmac } from 'node:crypto';
import webPush from 'web-push';
import { describe, expect, it, vi } from 'vitest';
import { deliverWithTransport } from './providers.js';
import { providerRequest } from './providers/payloads.js';
import type { ChannelType, DeliveryJob } from './monitor-types.js';
const channels: ChannelType[]=['email','sms','voice','slack','teams','discord','telegram','whatsapp','pagerduty','opsgenie','webhook','push'];
function job(channel: ChannelType): DeliveryJob {return {id:'event-123',channel,destination:'https://example.com/push',subject:'Unavailable',message:'Monitor unavailable',event:'alert',credentials:{}};}
function configured(channel: ChannelType): DeliveryJob {
  const ecdh=createECDH('prime256v1'); ecdh.generateKeys(); const vapid=webPush.generateVAPIDKeys();
  return {...job(channel),credentials:{apiKey:'test-key',from:'alerts@example.com',accountSid:`AC${'a'.repeat(32)}`,authToken:'test-token',webhookUrl:'https://example.com/webhook',botToken:'123:test-token',routingKey:'routing-key',signingSecret:'signing-key',p256dh:ecdh.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url'),vapidSubject:'mailto:admin@example.com',vapidPublicKey:vapid.publicKey,vapidPrivateKey:vapid.privateKey}};
}
describe('notification adapters',() => {
  it.each(channels)('%s stays unconfigured without credentials',async (channel) => {
    const transport=vi.fn(); expect(await deliverWithTransport(job(channel),transport)).toEqual({state:'unconfigured'}); expect(transport).not.toHaveBeenCalled();
  });
  it.each(channels)('%s sends a real protocol request and reports acceptance only',async (channel) => {
    const transport=vi.fn(async () => ({status:202,headers:{},body:'{}'}));
    expect(await deliverWithTransport(configured(channel),transport)).toEqual({state:'accepted'});
    expect(transport).toHaveBeenCalledOnce(); expect(transport.mock.calls[0]?.[0]).toMatchObject({method:'POST'});
  });
  it('signs exact webhook bytes with a stable event ID',() => {
    const request=providerRequest(configured('webhook'))!;
    expect(request.headers['X-Watchtower-Signature']).toBe(`sha256=${createHmac('sha256','signing-key').update(request.body).digest('hex')}`);
    expect(request.headers['X-Watchtower-Event']).toBe('event-123');
  });
  it('encrypts push payload and authenticates using VAPID',() => {
    const request=providerRequest(configured('push'))!;
    expect(Buffer.isBuffer(request.body)).toBe(true); expect(request.body.toString()).not.toContain('Monitor unavailable');
    expect(request.headers['Content-Encoding']).toBe('aes128gcm'); expect(request.headers.Authorization).toMatch(/^vapid /);
  });
  it('escapes voice XML and suppresses Discord mentions',() => {
    const voice=providerRequest({...configured('voice'),message:'<script>&"'})!;
    expect(new URLSearchParams(voice.body.toString()).get('Twiml')).toContain('&lt;script&gt;&amp;&quot;');
    expect(JSON.parse(providerRequest(configured('discord'))!.body.toString())).toMatchObject({allowed_mentions:{parse:[]}});
  });
  it('retries rate limits and server errors without claiming delivery',async () => {
    for (const status of [429,500,503]) expect(await deliverWithTransport(configured('email'),async () => ({status,headers:{},body:''}))).toEqual({state:'retry'});
    expect(await deliverWithTransport(configured('email'),async () => ({status:401,headers:{},body:'secret'}))).toEqual({state:'failed'});
  });
});
