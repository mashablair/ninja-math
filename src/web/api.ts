import type {Entry} from '../domain/events.ts';

export interface JourneyState {entries:Entry[];revision:number}
export type Operation='save'|'remove';
export class LoginRequired extends Error {}
export class Conflict extends Error {}

const body=async(response:Response):Promise<{error?:string;authenticated?:boolean}>=>response.json().catch(()=>({}));
const post=(path:string,data?:unknown)=>fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});

export async function fetchState():Promise<JourneyState> {
  const response=await fetch('/api/state',{cache:'no-store'});
  if(!response.ok) throw new Error('Could not connect');
  return response.json();
}
export async function fetchSession():Promise<boolean> {
  try { return !!(await body(await fetch('/api/session',{cache:'no-store'}))).authenticated; }
  catch { return false; }
}
export async function logIn(username:string,password:string) {
  let response:Response;
  try { response=await post('/api/login',{username,password}); }
  catch { throw new Error('Could not log in. Check your connection and try again.'); }
  if(!response.ok) throw new Error((await body(response)).error||'That username or password does not match.');
}
export async function logOut() {
  if(!(await post('/api/logout')).ok) throw new Error('Could not log out.');
}
// Saves are optimistic-concurrency writes against the revision the page last loaded.
export async function postEntry(operation:Operation,entryId:string,entry:object|undefined,revision:number) {
  const response=await post('/api/entry',{operation,entryId,entry,revision,requestId:crypto.randomUUID()});
  if(response.ok) return;
  const {error}=await body(response);
  if(response.status===401) throw new LoginRequired(error);
  if(response.status===409) throw new Conflict(error);
  throw new Error(error||'Could not save. Please try again.');
}
