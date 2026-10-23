import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,rmSync,statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script=resolve('scripts/setup-product-local.mjs');
test('local setup preserves configuration, protects files and is idempotent',()=>{const directory=mkdtempSync(join(tmpdir(),'watchtower-setup-test-'));try{writeFileSync(join(directory,'.env'),'CUSTOM_SETTING=preserved\n');const run=()=>spawnSync(process.execPath,[script],{cwd:directory,encoding:'utf8'});assert.equal(run().status,0);const content=readFileSync(join(directory,'.env'),'utf8');assert.match(content,/CUSTOM_SETTING=preserved/);assert.match(content,/BETTER_AUTH_SECRET=[a-f0-9]{64}/);assert.equal(statSync(join(directory,'.env')).mode&0o777,0o600);assert.equal(run().status,0);assert.equal(readFileSync(join(directory,'.env'),'utf8'),content);}finally{rmSync(directory,{recursive:true,force:true});}});
test('local setup rejects nonlocal databases without rewriting files',()=>{const directory=mkdtempSync(join(tmpdir(),'watchtower-setup-test-'));try{const original='DATABASE_URL=postgresql://test@example.invalid:5432/production\n';writeFileSync(join(directory,'.env'),original);assert.notEqual(spawnSync(process.execPath,[script],{cwd:directory,encoding:'utf8'}).status,0);assert.equal(readFileSync(join(directory,'.env'),'utf8'),original);}finally{rmSync(directory,{recursive:true,force:true});}});
