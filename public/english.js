import {today,nextSchoolDay,finishDate} from './schedule.js';
export const BASE_DATE = '2026-11-04';
export const LEVEL = 5;
export const LESSONS = 120;
export const BASELINE = 22;
// 98 weekdays starting November 4, 2026, when lesson 23 was next.
export const TARGET = '2027-03-19';
export function summarize(entries,asOf=today()) {
  const progress=Array.from({length:LESSONS},(_,i)=>i<BASELINE?1:0);
  let completedOn=null;
  const ordered=entries.filter(e=>e.subject==='english'&&e.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
  for(const e of ordered) if(e.status!=='skipped') {
    const wasComplete=progress.every(p=>p===1);
    progress[e.lesson-1]=e.progress;
    const isComplete=progress.every(p=>p===1);
    if(isComplete&&!wasComplete) completedOn=e.date;
    else if(!isComplete) completedOn=null;
  }
  const total=progress.reduce((a,b)=>a+b,0);
  const loggedToday=ordered.some(e=>e.date===asOf);
  const next=nextSchoolDay(asOf,!loggedToday);
  const finish=total===LESSONS?(completedOn||asOf):finishDate(next,Math.ceil(LESSONS-total));
  const nextLesson=progress.findIndex(p=>p<1)+1;
  return {progress,total,nextLesson,finish,loggedToday,completedOn};
}
