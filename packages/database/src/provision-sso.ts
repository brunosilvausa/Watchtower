import { randomUUID,X509Certificate } from 'node:crypto';
import { Resolver } from 'node:dns/promises';
import pg from 'pg';
import { z } from 'zod';
import { assertLocalTarget } from './local-target.js';
const configSchema=z.object({providerId:z.string().regex(/^[a-z0-9-]{3,64}$/),domain:z.string().regex(/^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/),ownerEmail:z.email(),issuer:z.string().min(3).max(500),entryPoint:z.url().refine(value=>new URL(value).protocol==='https:'),idpEntityId:z.string().min(3).max(500),certificate:z.string().min(100).max(20000)}).strict();
export async function provisionLocalSso(connectionString:string,input:unknown,resolveTxt:(hostname:string)=>Promise<string[][]>=hostname=>new Resolver({timeout:3000,tries:1}).resolveTxt(hostname)):Promise<string> {
  assertLocalTarget(connectionString,'watchtower_migrator');
  const value=configSchema.parse(input);const certificate=new X509Certificate(value.certificate);
  if(Date.parse(certificate.validTo)<=Date.now())throw new Error('Identity provider certificate has expired');
  const records=await resolveTxt(`_watchtower-sso.${value.domain}`);
  if(!records.some(parts=>parts.join('')===`watchtower-sso-verification=${value.providerId}`))throw new Error('Publish the required domain-control TXT record first');
  const pool=new pg.Pool({connectionString,max:1,connectionTimeoutMillis:5000});
  try {
    const owner=(await pool.query<{id:string}>('SELECT id FROM auth_user WHERE lower(email)=lower($1) AND "emailVerified" AND "twoFactorEnabled" AND "platformAdmin"',[value.ownerEmail])).rows[0];
    if(!owner)throw new Error('An existing verified MFA platform administrator must own the SSO connection');
    const config={issuer:value.issuer,entryPoint:value.entryPoint,cert:value.certificate,idpMetadata:{entityID:value.idpEntityId,cert:value.certificate},wantAssertionsSigned:true,authnRequestsSigned:false};
    await pool.query('INSERT INTO "ssoProvider"(id,issuer,"samlConfig","userId","providerId",domain,"domainVerified") VALUES($1,$2,$3,$4,$5,$6,true) ON CONFLICT("providerId") DO UPDATE SET issuer=EXCLUDED.issuer,"samlConfig"=EXCLUDED."samlConfig","userId"=EXCLUDED."userId",domain=EXCLUDED.domain,"domainVerified"=true',[randomUUID(),value.issuer,JSON.stringify(config),owner.id,value.providerId,value.domain]);
    return value.providerId;
  }finally{await pool.end();}
}
