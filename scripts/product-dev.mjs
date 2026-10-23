import { spawn } from 'node:child_process';
import { loadEnvFile } from 'node:process';
loadEnvFile('.env');
const worker=process.argv.includes('--worker');
const args=worker?['--filter','@watchtower/worker','dev']:['--filter','@watchtower/web','dev'];
const child=spawn('pnpm',args,{stdio:'inherit',env:{...process.env,...worker?{WATCHTOWER_WORKER_ENABLED:'true'}:{}}});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>child.kill(signal));
child.once('error',()=>{process.stderr.write('Could not start local product process\n');process.exitCode=1;});
child.once('exit',code=>{process.exitCode=code??1;});
