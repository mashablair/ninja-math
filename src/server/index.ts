import {Hono} from 'hono';
import {materialize,type StoredEvent} from '../domain/events.ts';
import {validate,ID} from '../domain/validate.ts';
import {ValidationError} from '../domain/errors.ts';
import {SESSION_MS,clearSessionCookie,credentialTag,readSession,sameSecret,sessionCookie,signSession} from './auth.ts';
import {secureAsset} from './security.ts';

type App={Bindings:Env};
const app=new Hono<App>();
const NO_STORE={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const fail=(error:string,status:number)=>Response.json({error},{status,headers:NO_STORE});
const ok=(data:unknown,extra?:Record<string,string>)=>Response.json(data,{headers:{...NO_STORE,...extra}});
const sameOrigin=(request:Request)=>request.headers.get('Origin')===new URL(request.url).origin;
const isJson=(request:Request)=>!!request.headers.get('Content-Type')?.startsWith('application/json');

async function events(env:Env) { return (await env.DB.prepare('SELECT * FROM events ORDER BY seq').all<StoredEvent>()).results; }
function configured(env:Env) { return typeof env.AUTH_USERNAME==='string'&&typeof env.AUTH_PASSWORD==='string'&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32; }
async function authenticated(request:Request,env:Env) {
  if(!configured(env)) return false;
  const session=await readSession(request.headers.get('Cookie'),env.SESSION_SECRET);
  return !!session&&await sameSecret(session.tag,await credentialTag(env.AUTH_USERNAME,env.AUTH_PASSWORD));
}
async function ipDigest(request:Request) {
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Per-minute counters in D1. Throttling slows guessing and floods; it is not the login.
async function hits(env:Env,bucket:string) {
  const row=await env.DB.prepare('INSERT INTO write_limits(bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket).first<{count:number}>();
  return row!.count;
}
const minute=()=>new Date().toISOString().slice(0,16);
async function backup(env:Env,key:string) {
  if(!env.BACKUPS) throw new Error('Backup storage is not configured.');
  await env.BACKUPS.put(key,JSON.stringify({schema:1,createdAt:new Date().toISOString(),events:await events(env)}),{httpMetadata:{contentType:'application/json'}});
}

app.get('/api/state',async c=>{
  const all=await events(c.env);
  return ok({entries:materialize(all),revision:all.at(-1)?.seq||0});
});
app.get('/api/session',async c=>ok({authenticated:await authenticated(c.req.raw,c.env)}));

app.post('/api/login',async c=>{
  const request=c.req.raw, NO_MATCH='That username or password does not match.';
  if(!sameOrigin(request)) return fail('Please log in from the dashboard.',403);
  if(!isJson(request)) return fail('JSON required',415);
  const raw=await request.text(); if(raw.length>2000) return fail(NO_MATCH,401);
  let input:{username?:unknown;password?:unknown}; try{input=JSON.parse(raw);}catch{return fail(NO_MATCH,401);}
  const username=typeof input?.username==='string'?input.username:'', password=typeof input?.password==='string'?input.password:'';
  if(username.length>200||password.length>200) return fail(NO_MATCH,401);
  if(await hits(c.env,`login:${minute()}:${await ipDigest(request)}`)>8) return fail('Too many tries. Wait a minute and try again.',429);
  if(!configured(c.env)) return fail('Log in is not ready on this copy yet.',500);
  const userOk=await sameSecret(username,c.env.AUTH_USERNAME), passOk=await sameSecret(password,c.env.AUTH_PASSWORD);
  if(!userOk||!passOk) return fail(NO_MATCH,401);
  const token=await signSession(c.env.SESSION_SECRET,{exp:Date.now()+SESSION_MS,tag:await credentialTag(c.env.AUTH_USERNAME,c.env.AUTH_PASSWORD)});
  return ok({ok:true},{'Set-Cookie':sessionCookie(token)});
});
app.post('/api/logout',c=>{
  if(!sameOrigin(c.req.raw)) return fail('Please log out from the dashboard.',403);
  return ok({ok:true},{'Set-Cookie':clearSessionCookie()});
});

app.post('/api/entry',async c=>{
  const request=c.req.raw, env=c.env;
  if(!await authenticated(request,env)) return fail('Please log in to save this.',401);
  if(!sameOrigin(request)) return fail('Please save from the dashboard.',403);
  if(!isJson(request)) return fail('JSON required',415);
  if(Number(request.headers.get('Content-Length'))>8192) return fail('Entry too large',413);
  const raw=await request.text(); if(raw.length>8192) return fail('Entry too large',413);
  let input:Record<string,unknown>; try{input=JSON.parse(raw);}catch{return fail('Invalid update',400);}
  if(!input||typeof input!=='object'||Array.isArray(input)) return fail('Invalid update',400);
  const {requestId,entryId,operation,revision}=input;
  if(typeof requestId!=='string'||!ID.test(requestId)||typeof entryId!=='string'||!ID.test(entryId)||(operation!=='save'&&operation!=='remove')||!Number.isInteger(revision)) return fail('Invalid update',400);
  if(await env.DB.prepare('SELECT seq FROM events WHERE request_id=?').bind(requestId).first()) return ok({ok:true});
  const payload=operation==='save'?JSON.stringify(validate(input.entry)):'{}';
  const current=await env.DB.prepare('SELECT COALESCE(MAX(seq),0) AS revision FROM events').first<{revision:number}>();
  if(current!.revision!==revision) return fail('Progress changed in another tab. Your form is still here; refresh progress and save again.',409);
  if(operation==='remove'&&!(await env.DB.prepare('SELECT 1 FROM events WHERE entry_id=?').bind(entryId).first())) return fail('Entry not found',404);
  if(await hits(env,`${minute()}:${await ipDigest(request)}`)>30) return fail('A lot of updates! Wait a minute and try again.',429);
  // Every accepted write is preceded by an immutable snapshot of the old state.
  await backup(env,`before-change/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.json`);
  const result=await env.DB.prepare('INSERT INTO events(request_id,entry_id,operation,payload) SELECT ?,?,?,? WHERE (SELECT COALESCE(MAX(seq),0) FROM events)=?').bind(requestId,entryId,operation,payload,revision).run();
  if(!result.meta.changes) return fail('Another update arrived. Refresh progress and try again.',409);
  return ok({ok:true});
});

app.all('/api/*',()=>fail('Not found',404));
app.all('*',async c=>secureAsset(await c.env.ASSETS.fetch(c.req.raw)));

app.onError(error=>{
  if(error instanceof ValidationError) return fail(error.message,400);
  console.error(JSON.stringify({message:'Request failed',error:error.message}));
  return fail('Could not save or load progress. Please try again. Your form has not been cleared.',500);
});

export default {
  fetch:app.fetch,
  async scheduled(event,env,ctx) {
    ctx.waitUntil((async()=>{
      await backup(env,`daily/${new Date(event.scheduledTime).toISOString().slice(0,10)}.json`);
      await env.DB.prepare('DELETE FROM write_limits WHERE bucket < ?').bind(new Date(Date.now()-86400000).toISOString().slice(0,16)).run();
    })());
  }
} satisfies ExportedHandler<Env>;
