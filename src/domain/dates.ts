// Dates are plain 'YYYY-MM-DD' strings. Arithmetic runs at noon UTC so it never crosses a day boundary.
export type Day=string;
export const DEFAULT_TIMEZONE='America/New_York';

export function today(when:Date=new Date(),timeZone:string=DEFAULT_TIMEZONE):Day {
  return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(when);
}
const noon=(day:Day)=>new Date(day+'T12:00:00Z');
export function addDays(day:Day,n:number):Day { const d=noon(day); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function weekday(day:Day):boolean { const n=noon(day).getUTCDay(); return n!==0&&n!==6; }
export function nextSchoolDay(day:Day,include=false):Day { let d=include?day:addDays(day,1); while(!weekday(d)) d=addDays(d,1); return d; }
export function finishDate(start:Day,slots:number):Day { let day=nextSchoolDay(start,true); for(let i=1;i<slots;i++) day=nextSchoolDay(day); return day; }
export const mondayOf=(day:Day):Day=>addDays(day,-((noon(day).getUTCDay()+6)%7));
export function isRealDay(value:unknown):value is Day {
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&noon(value).toISOString().slice(0,10)===value;
}
export function pretty(day:Day,year=false):string {
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(noon(day));
}
export const longDate=(day:Day):string=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(noon(day));
// Months are 'YYYY-MM'.
export const monthOf=(day:Day):string=>day.slice(0,7);
export function addMonths(month:string,n:number):string { const d=noon(month+'-15'); d.setUTCMonth(d.getUTCMonth()+n); return d.toISOString().slice(0,7); }
export const daysBetween=(from:Day,to:Day):number=>Math.round((noon(to).getTime()-noon(from).getTime())/86400000);
