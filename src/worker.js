import { BASE_DATE, today, materialize } from '../public/math.js';
import { BASE_DATE as ENGLISH_BASE, LEVEL } from '../public/english.js';
import { INSTRUMENTS, KINDS, MAX_MINUTES, MAX_SONG_TITLE, MAX_SONGS_PER_LOG } from '../public/music.js';
import { ACTIVITIES, MAX_SPORT_MINUTES } from '../public/sports.js';
import { SESSION_MS, clearSessionCookie, credentialTag, readSession, sameSecret, sessionCookie, signSession } from './auth.js';
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data,status=200,extra)=>{const h=new Headers(headers);if(extra)for(const [key,value] of Object.entries(extra))h.set(key,value);return new Response(JSON.stringify(data),{status,headers:h});};
const idValid=x=>typeof x==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(x);
function assertDate(date,earliest) {
  const label=earliest===ENGLISH_BASE?'November 4, 2026':'November 3, 2026';
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date<earliest||date>today()) throw new Error(`Choose a real date from ${label} through today.`);
}
function lessonEntry(entry,subject,earliest) {
  assertDate(entry.date,earliest);
  if(!['complete','partial','skipped'].includes(entry.status)) throw new Error('Choose a valid book and check-in.');
  if(typeof entry.note!=='string'||entry.note.length>500||typeof entry.reason!=='string'||entry.reason.length>100) throw new Error('Keep notes under 500 characters.');
  if(entry.status!=='skipped'&&(!Number.isInteger(entry.lesson)||entry.lesson<1||entry.lesson>120||![0.25,0.5,0.75,1].includes(entry.progress)||(entry.status==='complete')!==(entry.progress===1))) throw new Error('Choose a lesson from 1–120 and its completed amount.');
  return {date:entry.date,status:entry.status,lesson:entry.status==='skipped'?null:entry.lesson,progress:entry.status==='skipped'?0:entry.progress,note:entry.note.trim(),reason:entry.reason.trim(),subject};
}
export function validate(entry) {
  if(!entry||typeof entry!=='object'||Array.isArray(entry)) throw new Error('Choose a real date from November 3, 2026 through today.');
  if(entry.subject==='english') return {level:LEVEL,...lessonEntry(entry,'english',ENGLISH_BASE)};
  if(entry.subject==='sports') {
    assertDate(entry.date,BASE_DATE);
    if(!ACTIVITIES.some(item=>item.id===entry.activity)) throw new Error('Choose one of the sports.');
    if(!Number.isInteger(entry.minutes)||entry.minutes<1||entry.minutes>MAX_SPORT_MINUTES) throw new Error(`Choose the minutes you moved, from 1 to ${MAX_SPORT_MINUTES}.`);
    if(typeof entry.focus!=='string'||entry.focus.length>200) throw new Error('Keep what you did under 200 characters.');
    if(typeof entry.note!=='string'||entry.note.length>500) throw new Error('Keep notes under 500 characters.');
    return {subject:'sports',date:entry.date,activity:entry.activity,minutes:entry.minutes,focus:entry.focus.trim(),note:entry.note.trim()};
  }
  if(entry.subject==='song') {
    if(!INSTRUMENTS.some(item=>item.id===entry.instrument)) throw new Error('Choose piano, flute, or saxophone for this song.');
    if(typeof entry.title!=='string'||!entry.title.trim()||entry.title.trim().length>MAX_SONG_TITLE) throw new Error(`Choose a song name up to ${MAX_SONG_TITLE} characters.`);
    if(typeof entry.archived!=='boolean') throw new Error('Choose whether the song is archived.');
    return {subject:'song',instrument:entry.instrument,title:entry.title.trim(),archived:entry.archived};
  }
  if(entry.subject==='music') {
    assertDate(entry.date,BASE_DATE);
    if(!INSTRUMENTS.some(item=>item.id===entry.instrument)||!KINDS.includes(entry.kind)) throw new Error('Choose piano, flute, or saxophone, and practice or a teacher lesson.');
    if(!Number.isInteger(entry.minutes)||entry.minutes<1||entry.minutes>MAX_MINUTES) throw new Error('Choose the minutes you practiced, from 1 to 180.');
    const songs=entry.songs??[];
    if(!Array.isArray(songs)||songs.length>MAX_SONGS_PER_LOG||!songs.every(idValid)) throw new Error('Choose the songs you practiced.');
    if(typeof entry.focus!=='string'||entry.focus.length>200) throw new Error('Keep what you practiced under 200 characters.');
    if(!songs.length&&!entry.focus.trim()) throw new Error('Choose a song or write what you practiced.');
    if(typeof entry.note!=='string'||entry.note.length>500) throw new Error('Keep notes under 500 characters.');
    return {subject:'music',date:entry.date,instrument:entry.instrument,kind:entry.kind,minutes:entry.minutes,songs:[...new Set(songs)],focus:entry.focus.trim(),note:entry.note.trim()};
  }
  if(entry.subject&&entry.subject!=='math') throw new Error('Choose a valid subject.');
  const saved=lessonEntry(entry,'math',BASE_DATE);
  if(![5,6].includes(entry.book)) throw new Error('Choose a valid book and check-in.');
  const topic=entry.topic??'';
  if(typeof topic!=='string'||topic.length>100) throw new Error('Keep the lesson topic under 100 characters.');
  return {...saved,book:entry.book,topic:saved.status==='skipped'?'':topic.trim()};
}
async function events(env) { return (await env.DB.prepare('SELECT * FROM events ORDER BY seq').all()).results; }
function configured(env) { return typeof env.AUTH_USERNAME==='string'&&typeof env.AUTH_PASSWORD==='string'&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32; }
async function authenticated(request,env) {
  if(!configured(env)) return false;
  const session=await readSession(request.headers.get('Cookie'),env.SESSION_SECRET);
  return !!session&&await sameSecret(session.tag,await credentialTag(env.AUTH_USERNAME,env.AUTH_PASSWORD));
}
async function ipDigest(request) {
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function login(request,env,url) {
  if(request.headers.get('Origin')!==url.origin) return json({error:'Please log in from the dashboard.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'JSON required'},415);
  const raw=await request.text(); if(raw.length>2000) return json({error:'That username or password does not match.'},401);
  let input; try{input=JSON.parse(raw);}catch{return json({error:'That username or password does not match.'},401);}
  const username=typeof input?.username==='string'?input.username:'', password=typeof input?.password==='string'?input.password:'';
  if(username.length>200||password.length>200) return json({error:'That username or password does not match.'},401);
  const digest=await ipDigest(request);
  const bucket='login:'+new Date().toISOString().slice(0,16)+':'+digest;
  const rate=await env.DB.prepare('INSERT INTO write_limits(bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket).first();
  if(rate.count>8) return json({error:'Too many tries. Wait a minute and try again.'},429);
  if(!configured(env)) return json({error:'Log in is not ready on this copy yet.'},500);
  const userOk=await sameSecret(username,env.AUTH_USERNAME), passOk=await sameSecret(password,env.AUTH_PASSWORD);
  if(!userOk||!passOk) return json({error:'That username or password does not match.'},401);
  const token=await signSession(env.SESSION_SECRET,{exp:Date.now()+SESSION_MS,tag:await credentialTag(env.AUTH_USERNAME,env.AUTH_PASSWORD)});
  return json({ok:true},200,{'Set-Cookie':sessionCookie(token)});
}
async function backup(env,key) {
  if(!env.BACKUPS) throw new Error('Backup storage is not configured.');
  const data=await events(env);
  await env.BACKUPS.put(key,JSON.stringify({schema:1,createdAt:new Date().toISOString(),events:data}),{httpMetadata:{contentType:'application/json'}});
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    try {
      if(url.pathname==='/api/state'&&request.method==='GET') {
        const all=await events(env);
        return json({entries:materialize(all),revision:all.at(-1)?.seq||0});
      }
      if(url.pathname==='/api/session'&&request.method==='GET') return json({authenticated:await authenticated(request,env)});
      if(url.pathname==='/api/login'&&request.method==='POST') return await login(request,env,url);
      if(url.pathname==='/api/logout'&&request.method==='POST') {
        if(request.headers.get('Origin')!==url.origin) return json({error:'Please log out from the dashboard.'},403);
        return json({ok:true},200,{'Set-Cookie':clearSessionCookie()});
      }
      if(url.pathname==='/api/entry'&&request.method==='POST') {
        if(!await authenticated(request,env)) return json({error:'Please log in to save this.'},401);
        if(request.headers.get('Origin')!==url.origin) return json({error:'Please save from the dashboard.'},403);
        if(!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'JSON required'},415);
        if(Number(request.headers.get('Content-Length'))>8192) return json({error:'Entry too large'},413);
        const raw=await request.text(); if(raw.length>8192) return json({error:'Entry too large'},413);
        const input=JSON.parse(raw);
        if(!input||typeof input!=='object'||Array.isArray(input)) return json({error:'Invalid update'},400);
        if(!idValid(input.requestId)||!idValid(input.entryId)||!['save','remove'].includes(input.operation)||!Number.isInteger(input.revision)) return json({error:'Invalid update'},400);
        const duplicate=await env.DB.prepare('SELECT seq FROM events WHERE request_id=?').bind(input.requestId).first();
        if(duplicate) return json({ok:true});
        const payload=input.operation==='save'?JSON.stringify(validate(input.entry)):'{}';
        const current=await env.DB.prepare('SELECT COALESCE(MAX(seq),0) AS revision FROM events').first();
        if(current.revision!==input.revision) return json({error:'Progress changed in another tab. Your form is still here; refresh progress and save again.'},409);
        if(input.operation==='remove'&&!(await env.DB.prepare('SELECT 1 FROM events WHERE entry_id=?').bind(input.entryId).first())) return json({error:'Entry not found'},404);
        const bucket=new Date().toISOString().slice(0,16)+':'+(await ipDigest(request));
        const rate=await env.DB.prepare('INSERT INTO write_limits(bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket).first();
        if(rate.count>30) return json({error:'A lot of updates! Wait a minute and try again.'},429);
        // Every accepted write is preceded by an immutable snapshot of the old state.
        await backup(env,`before-change/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.json`);
        const result=await env.DB.prepare('INSERT INTO events(request_id,entry_id,operation,payload) SELECT ?,?,?,? WHERE (SELECT COALESCE(MAX(seq),0) FROM events)=?').bind(input.requestId,input.entryId,input.operation,payload,input.revision).run();
        if(!result.meta.changes) return json({error:'Another update arrived. Refresh progress and try again.'},409);
        return json({ok:true});
      }
      if(url.pathname.startsWith('/api/')) return json({error:'Not found'},404);
      const response=await env.ASSETS.fetch(request);
      const secured=new Response(response.body,response);
      secured.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
      secured.headers.set('X-Content-Type-Options','nosniff');
      secured.headers.set('Referrer-Policy','no-referrer');
      secured.headers.set('X-Robots-Tag','noindex, nofollow');
      return secured;
    } catch(error) {
      if(error instanceof SyntaxError || error.message.startsWith('Choose ') || error.message.startsWith('Keep ')) return json({error:error.message},400);
      console.error('Request failed:',error.message);
      return json({error:'Could not save or load progress. Please try again. Your form has not been cleared.'},500);
    }
  },
  async scheduled(event,env,ctx) {
    ctx.waitUntil((async()=>{await backup(env,`daily/${new Date(event.scheduledTime).toISOString().slice(0,10)}.json`);await env.DB.prepare('DELETE FROM write_limits WHERE bucket < ?').bind(new Date(Date.now()-86400000).toISOString().slice(0,16)).run();})());
  }
};
