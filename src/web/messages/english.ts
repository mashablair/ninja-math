import {pretty} from '../../domain/dates.ts';
import type {CourseCopy} from './types.ts';
import {pickFor,random,isWeekend,freshWeek} from './pick.ts';

const DAILY=[
  'Every page you read makes the next one easier.',
  'New words are treasures. You get to keep them.',
  'You don’t have to be fast. You just have to keep going.',
  'Stories get clearer one sentence at a time.',
  'I believe in you, Ninja!',
  'Small steps add up to big things.',
  'Asking for help is a real ninja move.',
  'One passage at a time. You’ve got this.',
  'Your effort today counts, whatever it looks like.',
  'Reading grows when you give it a little time.',
  'Confused is just the step before “I get it!”',
  'You are more capable than you think.'
];
const CELEBRATE=[
  'Your reading just leveled up!',
  'Another English sticker!',
  'Look at you go!',
  'That’s what practice looks like!',
  'You did the work. Be proud!',
  'Sticker earned. High five!',
  'Word ninja move!'
];
const PARTIAL=[
  'Progress saved. Little steps count!',
  'Saved! You’ll pick up right where you left off.',
  'Every bit of reading helps.',
  'Nice work today. The rest can wait for next time.'
];
const BREAK=[
  'Break saved. Rest helps your brain grow.',
  'Enjoy your break, Ninja!',
  'Recharge time. See you next lesson!',
  'Rest is part of learning too.'
];

export const english:CourseCopy={
  mascot:'/unicorn-english.svg',
  dailyMessage(day,{loggedToday,lastStatus}){
    if(loggedToday&&lastStatus==='skipped') return 'Rest is part of learning. See you next time!';
    if(loggedToday) return 'You already did English today. That’s awesome!';
    if(isWeekend(day)) return 'Weekend English is a bonus. No pressure at all!';
    if(freshWeek(day)) return 'New week, fresh start. Let’s go!';
    return pickFor(DAILY,day);
  },
  bookCheer(percent){
    if(percent>=100) return 'English 5 complete. Amazing!';
    if(percent>=90) return 'The finish line is so close!';
    if(percent>=50) return 'More than halfway there!';
    if(percent>=25) return 'Building momentum!';
    return 'A great start!';
  },
  celebrateMessage({finished,bookDone,percentBefore,percentAfter}){
    if(bookDone) return 'You finished English 5! Every single lesson. That’s huge.';
    if(percentBefore<50&&percentAfter>=50) return 'You’re more than halfway through English 5!';
    if(finished%10===0) return `That’s ${finished} lessons in English 5. A big milestone!`;
    if(120-finished<=10) return `Only ${120-finished} lessons left in English 5!`;
    return random(CELEBRATE);
  },
  partialMessage:()=>random(PARTIAL),
  breakMessage:()=>random(BREAK),
  allDone:{book:'English 5 finished',subtitle:'English 5 is complete. Look at everything you’ve read.'},
  week:{done:'English done',noun:'English',empty:'Your check-ins will show up here.'},
  journal:{
    note:'Lessons 1–22 are your starting progress and don’t have individual check-ins. Edits stay in the private backup history.',
    empty:['Your English story starts here.','Log a lesson, a little progress, or a day off. This is your space.']
  },
  plan:{
    title:'English 5',
    taglines:{5:'One level'},
    range:['2026-11-01','2027-08-31'],
    note(summary){
      const book=summary.books[5]!;
      return book.completedOn
        ?`English 5 was finished on ${pretty(book.finish,true)}.`
        :`At this pace English 5 wraps up ${pretty(book.finish,true)}. The original target, ${pretty(book.target,true)}, is the weekday plan from November 4, 2026.`;
    },
    info:{summary:'How does the English date work?',paragraphs:[
      'English has one level, 120 lessons. We plan one lesson each Monday–Friday, with no holiday breaks. Weekend work counts too. A partial entry records the total completed for that lesson. The original target, March 19, 2027, is 98 weekdays from November 4, 2026, when lessons 1–22 were already finished and lesson 23 was next. That target stays put. The projected finish moves when work is logged, skipped, or left unlogged.'
    ]}
  }
};
