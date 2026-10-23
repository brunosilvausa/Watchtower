import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, lstat, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
export async function sendIdentityEmail(email: string, url: string, subject: string): Promise<void> {
  if (process.env.MAIL_TRANSPORT === 'local') {
    const hostname = new URL(process.env.BETTER_AUTH_URL ?? '').hostname;
    const directory = process.env.AUTH_MAIL_DIRECTORY;
    if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname) || !directory || !isAbsolute(directory)) throw new Error('Local identity mail requires a loopback auth URL and absolute private directory');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0) throw new Error('Local identity mail directory must be private');
    await writeFile(join(directory, `${randomUUID()}.json`), JSON.stringify({ to: email, subject, url }), { mode: 0o600, flag: 'wx' });
    return;
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email provider is not configured');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject, text: `${subject}\n\n${url}` }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Identity email could not be accepted');
}
