import { withDeadline } from './deadline.js';
import { connect as tcpConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { resolve4, resolve6, resolveMx, resolveTxt } from 'node:dns/promises';
import { execFile } from 'node:child_process';
import { resolvePublic } from './network.js';
export async function socketProbe(host: string, port: number, signal: AbortSignal, tls: boolean, resolver = resolvePublic): Promise<Date | null> {
  const pinned = await withDeadline(resolver(host),signal); signal.throwIfAborted();
  return new Promise((resolve,reject) => {
    const socket = tls ? tlsConnect({host:pinned.address, port, servername:host, rejectUnauthorized:true}) : tcpConnect({host:pinned.address,port});
    const abort = () => socket.destroy(new Error('ABORTED'));
    signal.addEventListener('abort',abort,{once:true});
    socket.once('error',reject); socket.once('close',() => signal.removeEventListener('abort',abort));
    if (tls) {
      const secure = socket as ReturnType<typeof tlsConnect>;
      secure.once('secureConnect',() => { const expiry = new Date(secure.getPeerCertificate().valid_to); secure.destroy(); if (!Number.isFinite(expiry.getTime())) reject(new Error('INVALID_CERTIFICATE')); else resolve(expiry); });
    } else socket.once('connect',() => {socket.destroy(); resolve(null);});
  });
}
export async function dnsProbe(host: string, record: 'A'|'AAAA'|'MX'|'TXT'): Promise<string[]> {
  switch(record) {
    case 'A': return resolve4(host);
    case 'AAAA': return resolve6(host);
    case 'MX': return (await resolveMx(host)).map((entry) => entry.exchange);
    case 'TXT': return (await resolveTxt(host)).map((entry) => entry.join(''));
  }
}
export async function pingProbe(host: string, signal: AbortSignal, resolver = resolvePublic): Promise<void> {
  if (process.env.WATCHTOWER_ICMP_ENABLED !== 'true') throw new Error('ICMP_UNCONFIGURED');
  const pinned = await withDeadline(resolver(host),signal); signal.throwIfAborted();
  if (process.platform !== 'linux' && process.platform !== 'darwin') throw new Error('ICMP_UNCONFIGURED');
  const binary = pinned.family === 6 && process.platform === 'darwin' ? '/sbin/ping6' : '/sbin/ping';
  const args = [...(pinned.family === 6 && process.platform === 'linux' ? ['-6'] : []),'-n','-c','1', pinned.address];
  await new Promise<void>((resolve,reject) => execFile(binary,args,{signal,timeout:10000,maxBuffer:8192},(error) => error ? reject(new Error('ICMP_FAILED')) : resolve()));
}
