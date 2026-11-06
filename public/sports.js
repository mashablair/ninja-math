import {today} from './schedule.js';
import {activityCalendar,weekMinutes} from './calendar.js';
export const ACTIVITIES=[
  {id:'gym',name:'Gym'},
  {id:'running',name:'Running'},
  {id:'mountain-biking',name:'Mountain biking'},
  {id:'snorkeling',name:'Snorkeling'},
  {id:'water-skiing',name:'Water skiing'}
];
export const MAX_SPORT_MINUTES=300;
export function summarize(entries,asOf=today()) {
  const ordered=entries.filter(e=>e.subject==='sports'&&e.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
  return {entries:ordered,loggedToday:ordered.some(e=>e.date===asOf),minutes:weekMinutes(ordered,ACTIVITIES,'activity',asOf)};
}
export function sportsCalendar(entries,activity,asOf=today()) {
  return activityCalendar(entries.filter(e=>e.subject==='sports'&&e.activity===activity),asOf);
}
