export const BASE_DATE = '2026-11-03';
export const TARGETS = {5:'2027-01-06', 6:'2027-06-23'};
export function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function addDays(day,n) { const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function weekday(day) { const n=new Date(day+'T12:00:00Z').getUTCDay(); return n!==0&&n!==6; }
export function nextSchoolDay(day,include=false) { let d=include?day:addDays(day,1); while(!weekday(d)) d=addDays(d,1); return d; }
export function finishDate(start,slots) { let day=nextSchoolDay(start,true); for(let i=1;i<slots;i++) day=nextSchoolDay(day); return day; }
export function pretty(day,year=false) { return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')); }
export function materialize(events) {
  const entries=new Map();
  for(const event of [...events].sort((a,b)=>a.seq-b.seq)) {
    if(event.operation==='remove') entries.delete(event.entry_id);
    else entries.set(event.entry_id,{...JSON.parse(event.payload),id:event.entry_id,seq:event.seq});
  }
  return [...entries.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
}
export function summarize(entries,asOf=today()) {
  const progress={5:Array.from({length:120},(_,i)=>i<68?1:0),6:Array(120).fill(0)};
  const completedOn={};
  const ordered=entries.filter(e=>e.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
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
