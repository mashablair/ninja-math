import {today,addDays} from './schedule.js';
export const INSTRUMENTS=[{id:'piano',name:'Piano'},{id:'flute',name:'Flute'},{id:'saxophone',name:'Saxophone'}];
export const KINDS=['practice','lesson'];
export const MAX_MINUTES=180;
export function summarize(entries,asOf=today()) {
  const ordered=entries.filter(e=>e.subject==='music'&&e.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
  const loggedToday=ordered.some(e=>e.date===asOf);
  const monday=addDays(asOf,-((new Date(asOf+'T12:00:00Z').getUTCDay()+6)%7));
  const minutes=Object.fromEntries(INSTRUMENTS.map(item=>[item.id,0]));
  for(const entry of ordered) if(entry.date>=monday&&entry.date<=asOf&&minutes[entry.instrument]!=null) minutes[entry.instrument]+=entry.minutes;
  return {entries:ordered,loggedToday,minutes,lessons:ordered.filter(e=>e.kind==='lesson'),monday};
}
