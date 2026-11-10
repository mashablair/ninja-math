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
  mascot:'/ninja-saxophone.webp',
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
    label:'Today’s music',heading:'What did you play today?',
    intro:'Tap an instrument to save a practice. Every few minutes count.',
    done:'Played today ✓',saved:'Saved today'
  },
  lesson:['Lesson with my teacher','Save a lesson'],
  form:{
    title:(kind,editing)=>editing?'Make your music note just right.':kind==='lesson'?'A lesson with your teacher.':'What did you play?',
    itemLegend:'Instrument',
    focus:{label:'Anything else you worked on',placeholder:'Anything else? e.g. scales, long tones'},
    defaultMinutes:10,
    about:{piano:'your piano practice',flute:'your flute practice',saxophone:'your saxophone practice'},
    picked:name=>`Already picked, because you tapped ${name}. You can still switch.`
  },
  feel:{tough:'Tough',good:'Good',amazing:'Amazing!'},
  month:{
    intro:'Tap a day to see what you played. ♪ marks a lesson with your teacher.',
    empty:month=>`Nothing saved in ${month} yet. Your ninjas will show up here.`,
    nothing:day=>`Nothing saved on ${day}. Rest days are part of it too.`
  },
  thisWeek:{empty:'Nothing saved this week yet. A few minutes of playing counts!'},
  goal:{
    none:'Want a goal? Pick how many days you’d like to play each week.',set:'Set a goal',
    title:'My weekly goal',question:'How many days do you want to play each week?',
    hint:'It’s your goal. Change it any time, or have no goal at all.',
    progress:(days,goal)=>days?`${days} of ${goal} days. ${music.goal!.left(goal-days)}`:`Any day you play counts toward ${goal}.`,
    left:days=>`${days} more ${days===1?'day':'days'} to go.`,
    reached:'You reached your goal this week!',
    celebrate:'You reached your goal this week! That’s your own goal, and you did it.'
  },
  badges:{
    intro:earned=>earned?`${earned} ${earned===1?'badge':'badges'} so far. Each one is something you really did.`:'Badges show up as you play. Here’s what you can earn.',
    first:{
      piano:['Piano ninja','First piano day','Play the piano to earn this'],
      flute:['Flute ninja','First flute day','Play the flute to earn this'],
      saxophone:['Sax ninja','First saxophone day','Play the saxophone to earn this']
    },
    mix:['Triple play','All 3 instruments in one week','Play all 3 instruments in one week'],
    all:['Whole band','Played all three instruments','Play all three instruments'],
    month:name=>[name,`Made music in ${name}`]
  }
};
