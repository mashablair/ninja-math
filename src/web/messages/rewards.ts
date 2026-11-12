import type {LeagueSummary} from '../../domain/league.ts';
import {lessonsLeft,type UnitProgress} from '../../domain/subjects/course.ts';
import {plural} from '../format.ts';

// Belts follow karate order across units, Math 5 into Math 6. Leagues climb from Bronze to Unicorn.
export const BELTS=['White','Yellow','Orange','Green','Blue','Purple','Brown','Black'];
export const beltName=(belt:number)=>`${BELTS[Math.min(belt,BELTS.length-1)]} belt`;
export const LEAGUES=['Bronze','Silver','Gold','Jade','Ruby','Sapphire','Crystal','Rainbow','Unicorn'];
export const leagueName=(league:number)=>`${LEAGUES[league]} League`;

export const league={
  // What this week needs, said kindly. Mom chose leagues that can move down; the words never scold.
  status(s:LeagueSummary,tiers:number):string {
    const {week,goal,stay}=s, top=s.league===tiers-1, next=leagueName(s.league+1), here=leagueName(s.league);
    if(week.off) return 'This is a week off. Your league stays right where it is.';
    if(week.points>=goal) return top?`You did it! You stay at the very top, in ${here}.`:`Goal reached! You move up to ${next} on Monday.`;
    const toGo=goal-week.points;
    if(s.league>0&&week.points<stay) return `${plural(stay-week.points,'more lesson')} to stay in ${here}, ${toGo} to ${top?'stay on top':`move up to ${next}`}.`;
    return top?`${plural(toGo,'more lesson')} to stay on top.`:`${plural(toGo,'more lesson')} to move up to ${next}!`;
  },
  last(s:LeagueSummary):string {
    const last=s.last;
    if(!last) return 'Everyone starts in Bronze. 5 Math and 5 English lessons a week move you up!';
    if(last.result==='up') return `Last week you moved up to ${leagueName(s.league)}!`;
    if(last.result==='down') return `Last week was a lighter one, so this week you’re in ${leagueName(s.league)}. 5 + 5 moves you right back up!`;
    if(last.result==='off') return 'Last week was a week off. Welcome back!';
    return `You stayed in ${leagueName(s.league)} last week. Nice and steady.`;
  },
  promoted:(name:string)=>({title:`Welcome to ${name}!`,message:'You did 5 Math and 5 English lessons last week. That’s how you climb!'}),
  goalReached:(next:string|null)=>next?`That’s 5 Math and 5 English this week! You move up to ${next} on Monday.`:'That’s 5 Math and 5 English this week! You stay at the very top.'
};
export const belts={
  earned:(unit:number,belt:string)=>`Every lesson in Unit ${unit} is finished and checked. Tie on that ${belt.toLowerCase()}!`,
  toGo:(left:number,belt:string)=>left?`${plural(left,'more lesson')} to your ${belt.toLowerCase()}`:`Assessment time! Your ${belt.toLowerCase()} is waiting.`,
  // Every lesson is finished; Mom's checks are all that's left.
  checking:(left:number,belt:string)=>`All done! Once Mom checks ${left===1?'the last lesson':`${left} lessons`}, your ${belt.toLowerCase()} is yours.`
};
// What a unit's belt needs next: more lessons, the assessment, or Mom's checks.
export const beltToGo=(unit:UnitProgress,progress:readonly number[])=>
  unit.finished===unit.lessons?belts.checking(unit.lessons-unit.checked,beltName(unit.belt)):belts.toGo(lessonsLeft(unit,progress),beltName(unit.belt));
// Mom checked her work and every answer is right. Shown the next time she opens the subject.
const ALL_RIGHT=['Every answer is right. That’s careful work!','Checked and correct. Ninja precision!','Mom checked it: all correct. Be proud!','All right answers. Your hard work shows!'];
export const checks={
  title:(lessons:number[])=>lessons.length===1?`Lesson ${lessons[0]}: all correct!`:`${lessons.length} lessons, all correct!`,
  message:()=>ALL_RIGHT[Math.floor(Math.random()*ALL_RIGHT.length)]!
};
