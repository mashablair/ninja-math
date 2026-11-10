import type {Day} from '../../domain/dates.ts';
import type {Nudge} from '../../domain/nudge.ts';
import {pickFor} from './pick.ts';

// Tough love, as Mom and Ninja asked: teasing about the work, never about her. No "lazy", no scolding.
const dayName=(day:Day)=>new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
const lessons=(n:number)=>`${n} ${n===1?'lesson':'lessons'}`;

export function sassyMessage(nudge:Nudge,{subject,lesson,league,day}:{subject:string;lesson:number;league:string;day:Day}):string {
  const pick=(lines:string[])=>pickFor(lines,`${day}:${subject}`);
  switch(nudge.kind){
    case 'weekend': return pick([
      `It’s ${dayName(day)} and you’re at ${nudge.done} of 5 in ${subject}. Ninja mode: ON.`,
      `${lessons(nudge.left)} of ${subject}, ${nudge.days===1?'one day':'two days'} left. ${league} is watching.`,
      `The weekend is not a hiding spot. ${lessons(nudge.left)} of ${subject} to go!`,
      `${league} says hi. It would love to keep you. Just saying.`
    ]);
    case 'behind': return pick([
      `${nudge.done} of 5 ${subject} lessons and it’s already ${dayName(day)}. The lessons aren’t going to do themselves, ninja.`,
      `Your ${subject} dots are looking lonely this week. Go fill a couple in.`,
      `${nudge.expected-nudge.done} ${subject} lessons behind? That’s not very ninja of you. Fix it!`,
      `Plot twist: ${subject} lessons only count if you actually do them.`
    ]);
    case 'waiting': return pick([
      `Lesson ${lesson} has been waiting since ${dayName(nudge.since)}. It’s starting to feel ignored.`,
      `Lesson ${lesson} called. It wants to know if you’re mad at it.`,
      `${nudge.days} days without ${subject}? Your brain is filing a complaint.`,
      `Psst. Lesson ${lesson} is still sitting there. Waiting. Patiently. Kind of.`
    ]);
    case 'lopsided': return pick([
      `${nudge.other}: ${nudge.otherDone}. ${subject}: ${nudge.done}. Somebody’s playing favorites.`,
      `${subject} is jealous of all the attention ${nudge.other} is getting this week.`,
      `Love the ${nudge.other} streak! Now show ${subject} some love too.`
    ]);
  }
}
