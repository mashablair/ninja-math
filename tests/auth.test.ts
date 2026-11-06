import {test} from 'vitest';
import assert from 'node:assert/strict';
import worker from '../src/server/index.ts';
import {credentialTag, readSession, signSession} from '../src/server/auth.ts';
const fetchWith=(request:Request,env:unknown)=>worker.fetch(request as never,env as Env,{} as ExecutionContext) as Promise<Response>;

const SECRET = '0123456789abcdef0123456789abcdef';
const origin = 'http://localhost';
function db(count = 1) {
  return {prepare(sql){return {bind(){return this;}, async first(){
    if(sql.includes('write_limits')) return {count};
    if(sql.includes('MAX(seq)')) return {revision:0};
    return null;
  }, async all(){return {results:[]};}, async run(){return {meta:{changes:1}};}};}};
}
function env(count = 1, overrides = {}) {
  return {AUTH_USERNAME:'blair', AUTH_PASSWORD:'correct-horse', SESSION_SECRET:SECRET, DB:db(count), ...overrides};
}
function pair(response) { return response.headers.get('Set-Cookie').split(';')[0]; }

test('a wrong password is rejected and a right one lasts 30 days', async () => {
  const wrong = await fetchWith(new Request(`${origin}/api/login`, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json'}, body:JSON.stringify({username:'blair', password:'nope'})}), env());
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get('Set-Cookie'), null);
  const right = await fetchWith(new Request(`${origin}/api/login`, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json'}, body:JSON.stringify({username:'blair', password:'correct-horse'})}), env());
  assert.equal(right.status, 200);
  const cookie = right.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=2592000/);
  const session = await fetchWith(new Request(`${origin}/api/session`, {headers:{Cookie:pair(right)}}), env());
  assert.deepEqual(await session.json(), {authenticated:true});
});

test('writes stay closed until the session cookie is present', async () => {
  const body = JSON.stringify({operation:'save', entryId:'entry-1234', requestId:'request-1234', revision:0, entry:{}});
  const open = await fetchWith(new Request(`${origin}/api/state`), env());
  assert.equal(open.status, 200);
  const blocked = await fetchWith(new Request(`${origin}/api/entry`, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json'}, body}), env());
  assert.equal(blocked.status, 401);
  const tag = await credentialTag('blair', 'correct-horse');
  const token = await signSession(SECRET, {exp:Date.now() + 60_000, tag});
  const allowed = await fetchWith(new Request(`${origin}/api/entry`, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json', Cookie:`ninja_session=${token}`}, body}), env());
  assert.equal(allowed.status, 400);
});

test('an expired, tampered, or old-password session cannot save', async () => {
  const tag = await credentialTag('blair', 'correct-horse');
  const expired = await signSession(SECRET, {exp:Date.now() - 1000, tag});
  assert.equal(await readSession(`ninja_session=${expired}`, SECRET), null);
  const token = await signSession(SECRET, {exp:Date.now() + 60_000, tag});
  const dot = token.indexOf('.') + 1;
  const tampered = token.slice(0, dot) + (token[dot] === 'A' ? 'B' : 'A') + token.slice(dot + 1);
  assert.equal(await readSession(`ninja_session=${tampered}`, SECRET), null);
  const changed = await fetchWith(new Request(`${origin}/api/session`, {headers:{Cookie:`ninja_session=${token}`}}), env(1, {AUTH_PASSWORD:'a-new-password'}));
  assert.deepEqual(await changed.json(), {authenticated:false});
});

test('login guesses are limited and logout clears the cookie', async () => {
  const limited = await fetchWith(new Request(`${origin}/api/login`, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json'}, body:JSON.stringify({username:'blair', password:'correct-horse'})}), env(9));
  assert.equal(limited.status, 429);
  const missing = await fetchWith(new Request(`${origin}/api/login`, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json'}, body:'{"username":"blair","password":"correct-horse"}'}), env(1, {SESSION_SECRET:'too-short'}));
  assert.equal(missing.status, 500);
  const out = await fetchWith(new Request(`${origin}/api/logout`, {method:'POST', headers:{Origin:origin}}), env());
  assert.match(out.headers.get('Set-Cookie'), /Max-Age=0/);
});
