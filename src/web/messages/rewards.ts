import type {LeagueSummary} from '../../domain/league.ts';
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
  earned:(unit:number,belt:string)=>`You finished every lesson in Unit ${unit}. Tie on that ${belt.toLowerCase()}!`,
  toGo:(left:number,belt:string)=>left?`${plural(left,'more lesson')} to your ${belt.toLowerCase()}`:`Assessment time! Your ${belt.toLowerCase()} is waiting.`
};
