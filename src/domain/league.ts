import {addDays,mondayOf,today,type Day} from './dates.ts';
import type {Entry} from './events.ts';
import {completions} from './subjects/course.ts';
import type {CourseSubject,Student} from './subjects/types.ts';

export type LeagueResult='up'|'stay'|'down'|'off';
export interface LeagueWeek {
  monday:Day;
  // Lessons finished that week per subject, and points: the same, capped at the goal per subject.
  lessons:Record<string,number>;
  points:number;
  off:boolean;
  // The league she was in that week, and what happened at its end (null for this week).
  league:number;
  result:LeagueResult|null;
}
export interface LeagueSummary {league:number;goal:number;stay:number;week:LeagueWeek;history:LeagueWeek[];last:LeagueWeek|null}

export const weekOffId=(monday:Day)=>`weekoff-${monday}`;
// Everyone starts in the first league. Meeting the goal moves up one; under "stay" moves down one; never past either end.
export function summarizeLeague(student:Student,entries:readonly Entry[],asOf:Day=today()):LeagueSummary|null {
  const config=student.league;
  if(!config) return null;
  const subjects=student.subjects.filter((s):s is CourseSubject=>s.type==='course'&&config.subjects.includes(s.id));
  const done=subjects.map(subject=>({id:subject.id,days:completions(subject,entries).map(c=>c.date)}));
  const off=new Set(entries.filter(e=>e.subject==='weekoff').map(e=>String(e.week)));
  const goal=config.perSubject*subjects.length, current=mondayOf(asOf), weeks:LeagueWeek[]=[];
  let league=0;
  for(let monday=mondayOf(config.start);monday<=current;monday=addDays(monday,7)){
    const sunday=addDays(monday,6);
    const lessons=Object.fromEntries(done.map(s=>[s.id,s.days.filter(d=>d>=monday&&d<=sunday&&d<=asOf).length]));
    const points=Object.values(lessons).reduce((sum,n)=>sum+Math.min(n,config.perSubject),0);
    const week:LeagueWeek={monday,lessons,points,off:off.has(monday),league,result:null};
    if(monday<current){
      week.result=week.off?'off':points>=goal?(league<config.tiers-1?'up':'stay'):points>=config.stay||league===0?'stay':'down';
      league+=week.result==='up'?1:week.result==='down'?-1:0;
    }
    weeks.push(week);
  }
  const history=weeks.slice(0,-1).reverse();
  return {league,goal,stay:config.stay,week:weeks.at(-1)!,history,last:history[0]??null};
}
