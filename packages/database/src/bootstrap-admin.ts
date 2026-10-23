import pg from 'pg';
import { assertLocalTarget } from './local-target.js';
export async function bootstrapLocalAdmin(connectionString:string,email:string):Promise<boolean> {
  assertLocalTarget(connectionString,'watchtower_migrator');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('A valid existing account email is required');
  const pool=new pg.Pool({connectionString,max:1,connectionTimeoutMillis:5000});
  try {
    const result=await pool.query('UPDATE auth_user SET "platformAdmin"=true WHERE lower(email)=lower($1) AND "emailVerified" AND "twoFactorEnabled" AND EXISTS(SELECT 1 FROM "twoFactor" t WHERE t."userId"=auth_user.id AND t.verified=true) RETURNING id',[email]);
    return result.rowCount===1;
  } finally {await pool.end();}
}
