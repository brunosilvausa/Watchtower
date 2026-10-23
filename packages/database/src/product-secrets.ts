import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AccessError } from './product.js';
const scrypt = promisify(nodeScrypt);
export function newToken(prefix = 'wt_'): string { return prefix + randomBytes(32).toString('base64url'); }
export function tokenHash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
function encryptionKey(): Buffer { const key = process.env.PRODUCT_ENCRYPTION_KEY; if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new AccessError(503, 'Provider encryption is not configured'); return Buffer.from(key, 'hex'); }
export function encryptSecret(value: unknown): string { const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv); const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]); return [iv, cipher.getAuthTag(), ciphertext].map(x => x.toString('base64url')).join('.'); }
export function decryptSecret(value: string): Record<string, string> { const parts = value.split('.').map(x => Buffer.from(x, 'base64url')); if (parts.length !== 3)
    throw new Error('Invalid encrypted credential'); const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), parts[0]!); decipher.setAuthTag(parts[1]!); return JSON.parse(Buffer.concat([decipher.update(parts[2]!), decipher.final()]).toString('utf8')) as Record<string, string>; }
export async function hashPagePassword(value: string): Promise<string> { const salt = randomBytes(16).toString('hex'); const key = await scrypt(value, salt, 64) as Buffer; return `${salt}.${key.toString('hex')}`; }
export async function verifyPagePassword(value: string, hash: string): Promise<boolean> { const [salt, key] = hash.split('.'); if (!salt || !key)
    return false; const actual = await scrypt(value, salt, 64) as Buffer; const expected = Buffer.from(key, 'hex'); return actual.length === expected.length && timingSafeEqual(actual, expected); }
