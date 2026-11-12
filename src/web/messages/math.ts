import {pretty} from '../../domain/dates.ts';
import type {CourseCopy} from './types.ts';
import {pickFor,random,isWeekend,freshWeek} from './pick.ts';

const DAILY=[
  'Every lesson makes your brain a little stronger.',
  'Mistakes are how math muscles grow.',
  'You don’t have to be fast. You just have to keep going.',
  'Tricky problems are just puzzles waiting for you.',
  'I believe in you, Ninja!',
  'Small steps add up to big things.',
  'Asking for help is a real ninja move.',
  'One problem at a time. You’ve got this.',
  'Your effort today counts, whatever it looks like.',
  'Brains love practice. Let’s give yours some!',
  'Confused is just the step before “I get it!”',
  'You are more capable than you think.'
];
const CELEBRATE=[
  'Your brain just leveled up!',
  'Ninja skills: unlocked!',
  'Look at you go!',
  'Another sticker for your collection!',
  'That’s what practice looks like!',
  'You did the work. Be proud!',
  'Sticker earned. High five!',
  'Math ninja move!'
];
const PARTIAL=[
  'Progress saved. Little steps count!',
  'Saved! You’ll pick up right where you left off.',
  'Every bit of practice helps.',
  'Nice work today. The rest can wait for next time.'
];
const FIXED=[
  'Fixed and saved. Mistakes are how math muscles grow!',
  'Saved! Fixing mistakes is real ninja work.',
  'Nice fixing! Mom will take another look.'
];
const BREAK=[
  'Break saved. Rest helps your brain grow.',
  'Enjoy your break, Ninja!',
  'Recharge time. See you next lesson!',
  'Rest is part of learning too.'
];
const SCHOOL='2027-08-01';

export const math:CourseCopy={
  mascot:'/unicorn.svg',
  dailyMessage(day,{loggedToday,lastStatus}){
    if(loggedToday&&lastStatus==='skipped') return 'Rest is part of learning. See you next time!';
    if(loggedToday) return 'You already did math today. That’s awesome!';
    if(isWeekend(day)) return 'Weekend math is a bonus. No pressure at all!';
    if(freshWeek(day)) return 'New week, fresh start. Let’s go!';
    return pickFor(DAILY,day);
  },
  bookCheer(percent){
    if(percent>=100) return 'Book complete. Amazing!';
    if(percent>=90) return 'The finish line is so close!';
    if(percent>=50) return 'More than halfway there!';
    if(percent>=25) return 'Building momentum!';
    return 'A great start!';
  },
  celebrateMessage({finished,book,bookDone,percentBefore,percentAfter}){
    if(bookDone) return `You finished Math ${book}! Every single lesson. That’s huge.`;
    if(percentBefore<50&&percentAfter>=50) return `You’re more than halfway through Math ${book}!`;
    if(finished%10===0) return `That’s ${finished} lessons in Math ${book}. A big milestone!`;
    if(120-finished<=10) return `Only ${120-finished} lessons left in Math ${book}!`;
    return random(CELEBRATE);
  },
  partialMessage:()=>random(PARTIAL),
  breakMessage:()=>random(BREAK),
  fixedMessage:()=>random(FIXED),
  allDone:{book:'Both books finished',subtitle:'Math 5 and Math 6 are complete. Look at everything you’ve learned.'},
  week:{done:'Math done',noun:'math',empty:'Your check-ins will show up here.'},
  journal:{
    note:'Lessons 1–68 are your starting progress and don’t have individual check-ins. Edits stay in the private backup history.',
    empty:['Your story starts here.','Log a lesson, a little progress, or a day off. This is your space.']
  },
  plan:{
    title:'Road to 7th grade',
    taglines:{5:'Build your foundation',6:'Level up'},
    range:['2026-11-01','2027-08-31'],
    school:{date:SCHOOL,label:'7th grade'},
    marks:[{date:'2027-05-26',label:'Iowa test (late May)'}],
    note(summary){
      const end=summary.books[6]!.finish;
      return end<SCHOOL
        ?`At this pace Math 6 wraps up ${pretty(end,true)}, leaving a buffer before 7th grade in August (exact date TBD).`
        :`At this pace Math 6 wraps up ${pretty(end,true)}, which runs into August. Extra or weekend lessons would bring it earlier.`;
    },
    info:{summary:'How do the dates work?',paragraphs:[
      'We plan one lesson each Monday–Friday, with no holiday breaks. Weekend work counts too. Math 6 starts on the next weekday after Math 5 finishes. Projections use remaining lesson-equivalents, rounded up to whole study days. After a check-in today, remaining work is planned from the next weekday. An unlogged day stays unlogged; passing days still move the forecast. Target dates are reference points, not deadlines.',
      'Starting point on November 3, 2026: lessons 1–68 finished; lessons 69–74 need confirmation. No completed work is assumed for those six lessons.'
    ]}
  }
};
