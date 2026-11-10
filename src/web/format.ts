import {addDays,weekday,type Day} from '../domain/dates.ts';

export const num=(value:number)=>Number.isInteger(value)?String(value):String(Math.round(value*100)/100);
export const plural=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`;
export const longDay=(date:Day)=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
export const monthLabel=(month:string)=>new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(month+'-15T12:00:00Z'));
export const todayLabel=(timeZone:string)=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone}).format(new Date());
export function schoolDaysBetween(from:Day,to:Day) { let n=0,d=from; while(d<to){d=addDays(d,1);if(weekday(d))n++;} return n; }
export function versusTarget(projected:Day,target:Day) {
  if(projected>target) return `${plural(schoolDaysBetween(target,projected),'school day')} after target`;
  if(projected<target) return `${plural(schoolDaysBetween(projected,target),'school day')} ahead of target`;
  return 'Right on target';
}
export const cx=(...names:(string|false|null|undefined)[])=>names.filter(Boolean).join(' ');
