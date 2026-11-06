import {today} from './schedule.js';
import {activityCalendar,weekMinutes,mondayOf} from './calendar.js';
export {CALENDAR_WEEKS,level} from './calendar.js';
export const INSTRUMENTS=[{id:'piano',name:'Piano'},{id:'flute',name:'Flute'},{id:'saxophone',name:'Saxophone'}];
export const KINDS=['practice','lesson'];
export const MAX_MINUTES=180;
export const LESSON_MINUTES=30;
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
  return {entries:ordered,loggedToday,minutes:weekMinutes(ordered,INSTRUMENTS,'instrument',asOf),lessons:ordered.filter(e=>e.kind==='lesson'),monday:mondayOf(asOf)};
}
export function practiceCalendar(entries,instrument,asOf=today()) {
  return activityCalendar(entries.filter(e=>e.subject==='music'&&e.instrument===instrument),asOf);
}
