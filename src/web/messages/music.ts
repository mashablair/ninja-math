import type {PracticeCopy} from './types.ts';
import {pickFor,random,isWeekend,freshWeek} from './pick.ts';

const DAILY=[
  'A few careful minutes make a real difference.',
  'Piano, flute, or saxophone. Play the one that calls you.',
  'Mistakes are how music finds its shape.',
  'You don’t have to be perfect. You just have to play.',
  'I believe in you, Ninja!',
  'Soft notes count too.',
  'Listening is part of practicing.',
  'One song, one scale, one breath.',
  'Your effort today counts, whatever it sounds like.',
  'Make a sound you like. Then make it again.',
  'Slow practice is smart practice.',
  'You are more capable than you think.'
];
const CELEBRATE=[
  'That was real practice.',
  'Your future self can hear this.',
  'Look at you go!',
  'Music ninja move!',
  'You showed up for your instrument.',
  'Beautiful work.',
  'That’s what practice sounds like!'
];

export const music:PracticeCopy={
  mascot:'/unicorn-music.svg',
  dailyMessage(day,{loggedToday}){
    if(loggedToday) return 'You made music today. That’s awesome!';
    if(isWeekend(day)) return 'Weekend music is a bonus. No pressure at all!';
    if(freshWeek(day)) return 'New week, fresh sounds. Let’s go!';
    return pickFor(DAILY,day);
  },
  celebrateMessage:()=>random(CELEBRATE),
  celebrateTitle:(name,kind)=>kind==='lesson'?`${name} lesson saved!`:`${name} practice saved!`,
  preview:{sticker:'♪',title:'This is what practice looks like!',message:'Log a practice to earn the real thing.'},
  week:{done:'Music logged',noun:'music',empty:'Your practice will show up here.'},
  journal:{
    note:'Each practice and each teacher lesson is saved on its own. Edits stay in the private backup history.',
    empty:['Your music starts here.','Log a practice or a lesson with your teacher. This is your space.']
  },
  today:{
    label:'Today’s music',heading:'What did you play?',days:'Days with music',
    intro:'Piano, flute, or saxophone. Save a practice, and a lesson with your teacher when you have one.',
    empty:'Nothing saved for today yet. Add a practice when you’re ready.'
  },
  actions:{practice:['I practiced','Save what you played'],lesson:['Lesson with my teacher','Save that too']},
  calendar:{heading:'My practice calendar',intro:'Each square is a day. More minutes make it darker. Tap a square to see what you played.'},
  form:{
    title:(kind,editing)=>editing?'Make your music note just right.':kind==='lesson'?'A lesson with your teacher.':'What did you play?',
    itemLegend:'Instrument',
    focus:{label:'Anything else you worked on',placeholder:'Anything else? e.g. scales, long tones'},
    defaultMinutes:20,
    defaultItem:'unlogged'
  }
};
