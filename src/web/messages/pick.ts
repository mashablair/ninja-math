import type {Day} from '../../domain/dates.ts';

// A stable pick per day, so the message doesn't change on every refresh.
const hash=(text:string)=>[...text].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7);
export const pickFor=(list:readonly string[],day:Day)=>list[Math.abs(hash(day))%list.length]!;
export const random=(list:readonly string[])=>list[Math.floor(Math.random()*list.length)]!;
export const isWeekend=(day:Day)=>[0,6].includes(new Date(day+'T12:00:00Z').getUTCDay());
export const freshWeek=(day:Day)=>new Date(day+'T12:00:00Z').getUTCDay()===1&&hash(day)%2===0;
