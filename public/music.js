import {today,addDays} from './schedule.js';
export const INSTRUMENTS=[{id:'piano',name:'Piano'},{id:'flute',name:'Flute'},{id:'saxophone',name:'Saxophone'}];
export const KINDS=['practice','lesson'];
export const MAX_MINUTES=180;
export const MAX_SONG_TITLE=60;
export const MAX_SONGS_PER_LOG=20;
export const STARTING_SONGS=[
  {id:'song-saxophone-ragtime',instrument:'saxophone',title:'Ragtime'},
  {id:'song-saxophone-in-the-mood',instrument:'saxophone',title:'In the Mood'},
  {id:'song-saxophone-satin-doll',instrument:'saxophone',title:'Satin Doll'}
];
export function songBank(entries) {
  const songs=new Map(STARTING_SONGS.map(song=>[song.id,{...song,archived:false,seq:0}]));
  for(const entry of entries) if(entry.subject==='song') songs.set(entry.id,{id:entry.id,instrument:entry.instrument,title:entry.title,archived:!!entry.archived,seq:entry.seq});
  return [...songs.values()];
}
export function songsFor(bank,instrument) {
  return bank.filter(song=>song.instrument===instrument).sort((a,b)=>a.title.localeCompare(b.title,'en',{sensitivity:'base'}));
}
export function summarize(entries,asOf=today()) {
  const ordered=entries.filter(e=>e.subject==='music'&&e.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
  const loggedToday=ordered.some(e=>e.date===asOf);
  const monday=addDays(asOf,-((new Date(asOf+'T12:00:00Z').getUTCDay()+6)%7));
  const minutes=Object.fromEntries(INSTRUMENTS.map(item=>[item.id,0]));
  for(const entry of ordered) if(entry.date>=monday&&entry.date<=asOf&&minutes[entry.instrument]!=null) minutes[entry.instrument]+=entry.minutes;
  return {entries:ordered,loggedToday,minutes,lessons:ordered.filter(e=>e.kind==='lesson'),monday};
}
export const CALENDAR_WEEKS=53;
export const level=minutes=>minutes<=0?0:minutes<15?1:minutes<30?2:minutes<45?3:4;
export function practiceCalendar(entries,instrument,asOf=today()) {
  const logs=entries.filter(e=>e.subject==='music'&&e.instrument===instrument);
  const sunday=addDays(asOf,-new Date(asOf+'T12:00:00Z').getUTCDay());
  const start=addDays(sunday,-7*(CALENDAR_WEEKS-1));
  const byDate=new Map();
  for(const entry of logs) if(entry.date>=start&&entry.date<=asOf) {
    if(!byDate.has(entry.date)) byDate.set(entry.date,[]);
    byDate.get(entry.date).push(entry);
  }
  let days=0;
  const weeks=Array.from({length:CALENDAR_WEEKS},(_,w)=>Array.from({length:7},(_,d)=>{
    const date=addDays(start,w*7+d), dayLogs=(byDate.get(date)||[]).sort((a,b)=>a.seq-b.seq);
    const minutes=dayLogs.reduce((sum,e)=>sum+e.minutes,0);
    if(dayLogs.length&&date<=asOf) days++;
    return {date,minutes,level:level(minutes),lesson:dayLogs.some(e=>e.kind==='lesson'),entries:dayLogs,future:date>asOf};
  }));
  const months=weeks.map((week,w)=>{
    const first=week.find(day=>day.date.endsWith('-01'));
    return first&&!first.future?first.date.slice(0,7):w===0&&!weeks.slice(1,3).some(next=>next.some(day=>day.date.endsWith('-01')))?week[0].date.slice(0,7):'';
  });
  return {weeks,months,days};
}
