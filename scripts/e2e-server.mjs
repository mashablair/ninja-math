import {rmSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';

// Browser tests run against a throwaway local database in .wrangler/e2e, with test-only credentials.
// They never touch .wrangler/state (local copy of real data) or production.
export const E2E={port:8790,username:'e2e-tester',password:'e2e-password-not-secret',persist:'.wrangler/e2e'};
const env={...process.env,XDG_CONFIG_HOME:process.env.XDG_CONFIG_HOME||'.wrangler/xdg',WRANGLER_LOG_PATH:'.wrangler/e2e.log',CI:'1'};
const wrangler=['node_modules/wrangler/bin/wrangler.js'];

if(import.meta.url===`file://${process.argv[1]}`){
  rmSync(E2E.persist,{recursive:true,force:true});
  const migrate=spawnSync(process.execPath,[...wrangler,'d1','migrations','apply','ninja-math','--local','--persist-to',E2E.persist],{env,stdio:'inherit'});
  if(migrate.status!==0) process.exit(migrate.status??1);
  const server=spawn(process.execPath,[...wrangler,'dev','--local','--persist-to',E2E.persist,'--port',String(E2E.port),'--show-interactive-dev-session=false',
    '--var',`AUTH_USERNAME:${E2E.username}`,'--var',`AUTH_PASSWORD:${E2E.password}`,'--var',`SESSION_SECRET:${'e2e-session-secret-'.repeat(3)}`],{env,stdio:'inherit'});
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.kill(signal));
  server.on('exit',code=>process.exit(code??0));
}
