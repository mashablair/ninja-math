import {today,addDays,daysBetween,mondayOf,type Day} from './dates.ts';
import type {Entry} from './events.ts';

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
