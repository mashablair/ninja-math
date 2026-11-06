import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {materialize} from '../src/domain/events.ts';
import {validate} from '../src/domain/validate.ts';

// Owner-only CLI. Nothing on the public website can read or restore R2 backups.
const [path,...flags]=process.argv.slice(2);
if(!path){console.error('Usage: node scripts/restore.mjs backups/snapshot.json [--apply] [--remote]');process.exit(1);}
const snapshot=JSON.parse(readFileSync(path,'utf8'));
if(snapshot.schema!==1||(!Array.isArray(snapshot.events)&&!Array.isArray(snapshot.entries)))throw new Error('Unsupported backup');
const entries=snapshot.events?materialize(snapshot.events):snapshot.entries;
for(const entry of entries){validate(entry);if(!/^[a-zA-Z0-9-]{8,80}$/.test(entry.id))throw new Error('Invalid entry ID');}
console.log(`Snapshot: ${snapshot.createdAt||snapshot.exportedAt}; ${entries.length} active check-ins.`);
if(!flags.includes('--apply')){console.log('Dry run only. Add --apply to restore; add --remote for production.');process.exit(0);}
const mode=flags.includes('--remote')?'--remote':'--local';
const wrangler=(args)=>{const run=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8'});if(run.status!==0)throw new Error(run.stderr||run.stdout);return run.stdout;};
mkdirSync('backups',{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
// Preserve the complete database before recovery, including the original audit trail.
console.log(wrangler(['d1','export','ninja-math',mode,'--output',`backups/before-restore-${stamp}.sql`]));
const result=JSON.parse(wrangler(['d1','execute','ninja-math',mode,'--command','SELECT * FROM events ORDER BY seq','--json']));
const rows=result.flatMap(r=>r.results||[]),current=materialize(rows);
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const statements=[];
for(const entry of current) statements.push(`INSERT INTO events(request_id,entry_id,operation,payload) VALUES (${quote(randomUUID())},${quote(entry.id)},'remove','{}');`);
for(const entry of entries) statements.push(`INSERT INTO events(request_id,entry_id,operation,payload) VALUES (${quote(randomUUID())},${quote(entry.id)},'save',${quote(JSON.stringify(validate(entry)))});`);
if(!statements.length){console.log('Both states are empty; nothing to restore.');process.exit(0);}
const sqlPath=`backups/restore-${stamp}.sql`;writeFileSync(sqlPath,statements.join('\n'));
console.log(wrangler(['d1','execute','ninja-math',mode,'--file',sqlPath]));
console.log('Restore complete. Original audit events remain in the database. Refresh the dashboard.');
