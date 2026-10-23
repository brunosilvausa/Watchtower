import { readFileSync,appendFileSync,mkdirSync,chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
const file=resolve('.env');
let existing='';try{existing=readFileSync(file,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
const variables=Object.fromEntries(existing.split('\n').filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1)];}));
if(variables.DATABASE_URL){const target=new URL(variables.DATABASE_URL);if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname)||target.port!=='55432'||target.pathname!=='/watchtower_dev')throw new Error('Local setup requires the dedicated Watchtower database');}
const mail=resolve('.local/mail');mkdirSync(mail,{recursive:true,mode:0o700});chmodSync(mail,0o700);
const defaults={DATABASE_URL:'postgresql://watchtower_app:local-app-only@127.0.0.1:55432/watchtower_dev',DATABASE_MIGRATION_URL:'postgresql://watchtower_migrator:local-migrator-only@127.0.0.1:55432/watchtower_dev',DATABASE_TEST_URL:'postgresql://watchtower_app:local-app-only@127.0.0.1:55432/watchtower_dev',DATABASE_WORKER_URL:'postgresql://watchtower_worker:local-worker-only@127.0.0.1:55432/watchtower_dev',BETTER_AUTH_URL:'http://127.0.0.1:3000',BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),PRODUCT_ENCRYPTION_KEY:randomBytes(32).toString('hex'),MAIL_TRANSPORT:'local',AUTH_MAIL_DIRECTORY:JSON.stringify(mail),WATCHTOWER_REGION:'local'};
const additions=Object.entries(defaults).filter(([key])=>variables[key]===undefined||variables[key]==='').map(([key,value])=>`${key}=${value}`);
if(additions.length)appendFileSync(file,`\n# Local product configuration; never deploy these database credentials.\n${additions.join('\n')}\n`,{mode:0o600});chmodSync(file,0o600);
process.stdout.write(`Local configuration ready. ${additions.length} missing variables added; existing values preserved. Secrets omitted.\n`);
