import {addDays,mondayOf,today,weekday,type Day} from './dates.ts';
import type {Entry} from './events.ts';
import type {LeagueSummary} from './league.ts';
import type {CourseSubject,Student} from './subjects/types.ts';

// When she's slipping on her 5 lessons a week, Ninja says so, with sass she can turn off in Tweaks.
// Never on a week Mom marked off, never once she's checked in today, and never before the league started.
export type Nudge=
  |{kind:'weekend';done:number;left:number;days:number}
  |{kind:'behind';done:number;expected:number}
  |{kind:'waiting';since:Day;days:number}
  |{kind:'lopsided';done:number;other:string;otherDone:number};

const weekdaysBetween=(from:Day,to:Day)=>{let n=0;for(let d=addDays(from,1);d<to;d=addDays(d,1)) if(weekday(d)) n++;return n;};

export function nudgeFor(student:Student,subject:CourseSubject,entries:readonly Entry[],league:LeagueSummary|null,asOf:Day=today()):Nudge|null {
  const config=student.league;
  if(!config||!league||!config.subjects.includes(subject.id)||league.week.off||asOf<config.start) return null;
  const mine=entries.filter(e=>e.subject===subject.id&&e.date!=null&&e.date<=asOf&&e.status!=='skipped');
  if(mine.some(e=>e.date===asOf)) return null;
  const done=league.week.lessons[subject.id]??0, goal=config.perSubject, monday=mondayOf(asOf);
  if(done>=goal) return null;
  // The weekend is the last chance: Saturday has two days left, Sunday one.
  if(!weekday(asOf)) return {kind:'weekend',done,left:goal-done,days:asOf===addDays(monday,5)?2:1};
  // One lesson per weekday so far, not counting today.
  const expected=Math.min(goal,weekdaysBetween(addDays(monday,-1),asOf));
  if(expected-done>=2) return {kind:'behind',done,expected};
  const last=mine.map(e=>e.date!).sort().at(-1)??addDays(config.start,-1);
  const days=weekdaysBetween(last,asOf);
  if(days>=2) return {kind:'waiting',since:addDays(last,1),days};
  const other=config.subjects.find(id=>id!==subject.id), otherDone=other?league.week.lessons[other]??0:0;
  if(other&&otherDone-done>=3) return {kind:'lopsided',done,other,otherDone};
  return null;
}
