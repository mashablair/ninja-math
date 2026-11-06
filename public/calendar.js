import {today,addDays} from './schedule.js';
export const CALENDAR_WEEKS=53;
export const level=minutes=>minutes<=0?0:minutes<15?1:minutes<30?2:minutes<45?3:4;
export const mondayOf=day=>addDays(day,-((new Date(day+'T12:00:00Z').getUTCDay()+6)%7));
export function weekMinutes(logs,items,key,asOf=today()) {
  const monday=mondayOf(asOf), minutes=Object.fromEntries(items.map(item=>[item.id,0]));
  for(const entry of logs) if(entry.date>=monday&&entry.date<=asOf&&minutes[entry[key]]!=null) minutes[entry[key]]+=entry.minutes;
  return minutes;
}
export function activityCalendar(logs,asOf=today()) {
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
