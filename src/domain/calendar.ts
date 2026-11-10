import {today,addDays,daysBetween,mondayOf,sundayOf,type Day} from './dates.ts';
import type {Entry} from './events.ts';
import type {Item} from './subjects/types.ts';

export const CALENDAR_WEEKS=53;
export const level=(minutes:number)=>minutes<=0?0:minutes<15?1:minutes<30?2:minutes<45?3:4;
export interface CalendarDay {date:Day;minutes:number;level:number;lesson:boolean;entries:Entry[];future:boolean}
export interface Calendar {weeks:CalendarDay[][];months:string[];days:number}

export function weekMinutes(logs:readonly Entry[],items:readonly Item[],field:string,asOf:Day=today()):Record<string,number> {
  const monday=mondayOf(asOf), minutes:Record<string,number>=Object.fromEntries(items.map(item=>[item.id,0]));
  for(const entry of logs) {
    const id=String(entry[field]);
    if(entry.date!>=monday&&entry.date!<=asOf&&minutes[id]!=null) minutes[id]+=Number(entry.minutes);
  }
  return minutes;
}
// A GitHub-style year: Sunday-first weeks ending with the current one.
export function activityCalendar(logs:readonly Entry[],asOf:Day=today()):Calendar {
  const start=addDays(sundayOf(asOf),-7*(CALENDAR_WEEKS-1));
  const byDate=new Map<Day,Entry[]>();
  for(const entry of logs) if(entry.date!>=start&&entry.date!<=asOf) {
    if(!byDate.has(entry.date!)) byDate.set(entry.date!,[]);
    byDate.get(entry.date!)!.push(entry);
  }
  let days=0;
  const weeks=Array.from({length:CALENDAR_WEEKS},(_,w)=>Array.from({length:7},(_,d)=>{
    const date=addDays(start,w*7+d), dayLogs=(byDate.get(date)||[]).sort((a,b)=>a.seq-b.seq);
    const minutes=dayLogs.reduce((sum,e)=>sum+Number(e.minutes),0);
    if(dayLogs.length&&date<=asOf) days++;
    return {date,minutes,level:level(minutes),lesson:dayLogs.some(e=>e.kind==='lesson'),entries:dayLogs,future:date>asOf};
  }));
  const months=weeks.map((week,w)=>{
    const first=week.find(day=>day.date.endsWith('-01'));
    return first&&!first.future?first.date.slice(0,7):w===0&&!weeks.slice(1,3).some(next=>next.some(day=>day.date.endsWith('-01')))?week[0]!.date.slice(0,7):'';
  });
  return {weeks,months,days};
}

export interface MonthDay {date:Day;minutes:number;entries:Entry[];future:boolean}
// One month in Monday-first weeks. Blank spaces before the 1st and after the last day are null.
export function monthCalendar(logs:readonly Entry[],month:string,asOf:Day=today()):(MonthDay|null)[][] {
  const first=month+'-01', cells:(MonthDay|null)[]=Array.from({length:daysBetween(mondayOf(first),first)},()=>null);
  for(let date=first;date.startsWith(month);date=addDays(date,1)){
    const entries=logs.filter(e=>e.date===date).sort((a,b)=>a.seq-b.seq);
    cells.push({date,minutes:entries.reduce((sum,e)=>sum+Number(e.minutes),0),entries,future:date>asOf});
  }
  while(cells.length%7) cells.push(null);
  return Array.from({length:cells.length/7},(_,w)=>cells.slice(w*7,w*7+7));
}
