import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';

// Replaces the LOCAL database with a copy of the live check-ins, so local testing uses real data.
// It only reads the public /api/state and only ever writes with --local. Production is never written.
const LIVE='https://homeschool-ninja.com/api/state';
if(process.argv.some(arg=>arg.includes('remote'))){console.error('This script only writes to the local database.');process.exit(1);}

const response=await fetch(LIVE,{headers:{'Cache-Control':'no-store'}});
if(!response.ok){console.error(`Could not read ${LIVE}: ${response.status}`);process.exit(1);}
const {entries,revision}=await response.json();
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const statements=['DELETE FROM events;','DELETE FROM write_limits;',...[...entries].sort((a,b)=>a.seq-b.seq).map(({id,seq,...payload})=>
  `INSERT INTO events(request_id,entry_id,operation,payload) VALUES (${quote(randomUUID())},${quote(id)},'save',${quote(JSON.stringify(payload))});`)];

mkdirSync('.wrangler/tmp',{recursive:true});
const file='.wrangler/tmp/pull-live.sql';
writeFileSync(file,statements.join('\n'));
const env={...process.env,XDG_CONFIG_HOME:process.env.XDG_CONFIG_HOME||'.wrangler/xdg',WRANGLER_LOG_PATH:'.wrangler/wrangler.log'};
const wrangler=args=>spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{env,stdio:'inherit'});
if(wrangler(['d1','migrations','apply','ninja-math','--local']).status!==0) process.exit(1);
if(wrangler(['d1','execute','ninja-math','--local','--file',file]).status!==0) process.exit(1);
console.log(`Local database now mirrors the live site: ${entries.length} entries (live revision ${revision}). Restart wrangler dev if it is running.`);
