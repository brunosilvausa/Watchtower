import { readFile } from 'node:fs/promises';
import { provisionLocalSso } from './provision-sso.js';
const [file,confirmation]=process.argv.slice(2);
if(!file||confirmation!=='--confirm-local-sso'){process.stderr.write('Usage: provision-sso-cli.ts <configuration.json> --confirm-local-sso\n');process.exitCode=1;}
else {try{await provisionLocalSso(process.env.DATABASE_MIGRATION_URL??'',JSON.parse(await readFile(file,'utf8')));process.stdout.write('Local SAML provider configured after domain TXT verification. IdP login still requires validation.\n');}catch{process.stderr.write('SAML provisioning failed; check configuration, certificate, domain TXT and administrator prerequisites.\n');process.exitCode=1;}}
