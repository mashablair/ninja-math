import {today,nextSchoolDay,finishDate} from './schedule.js';
export {today,addDays,weekday,nextSchoolDay,finishDate,pretty,materialize} from './schedule.js';
export const BASE_DATE = '2026-11-03';
export const TARGETS = {5:'2027-01-06', 6:'2027-06-23'};
const isMath=entry=>!entry.subject||entry.subject==='math';
export function summarize(entries,asOf=today()) {
  const progress={5:Array.from({length:120},(_,i)=>i<68?1:0),6:Array(120).fill(0)};
  const completedOn={};
  const ordered=entries.filter(e=>isMath(e)&&e.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
  for(const e of ordered) if(e.status!=='skipped') {
    const wasComplete=progress[e.book].every(p=>p===1);
    progress[e.book][e.lesson-1]=e.progress;
    const isComplete=progress[e.book].every(p=>p===1);
    if(isComplete&&!wasComplete) completedOn[e.book]=e.date;
    else if(!isComplete) delete completedOn[e.book];
  }
  const totals={5:progress[5].reduce((a,b)=>a+b,0),6:progress[6].reduce((a,b)=>a+b,0)};
  const loggedToday=ordered.some(e=>e.date===asOf);
  const next=nextSchoolDay(asOf,!loggedToday);
  const math5=totals[5]===120?(completedOn[5]||asOf):finishDate(next,Math.ceil(120-totals[5]));
  const math6Start=nextSchoolDay(math5);
  const effective6Start=math6Start>next?math6Start:next;
  const math6=totals[6]===120?(completedOn[6]||asOf):finishDate(effective6Start,Math.ceil(120-totals[6]));
  const active=totals[5]<120?5:6;
  const backlog=Array.from({length:6},(_,i)=>69+i).filter(l=>progress[5][l-1]<1);
  const planned=progress[5].findIndex((p,i)=>i>=74&&p<1)+1;
  const nextLesson=active===5?(planned||progress[5].findIndex(p=>p<1)+1):progress[6].findIndex(p=>p<1)+1;
  return {progress,totals,active,backlog,nextLesson,math5,math6Start,math6,loggedToday};
}
