import type {PracticeCopy} from './types.ts';
import {pickFor,random,isWeekend} from './pick.ts';

const DAILY=[
  'Move in a way that feels good today.',
  'Gym, run, ride, snorkel, or ski. You pick.',
  'Strong bodies help busy brains.',
  'Every bit of moving counts.',
  'Have fun out there, Ninja!',
  'A short run is still a run.',
  'Rest is part of getting stronger.',
  'Try something a little new.',
  'Water, sunscreen, and a big smile.',
  'You are stronger than you think.'
];
const CELEBRATE=[
  'Ninja moves!',
  'Your body says thank you.',
  'Look at you go!',
  'That was real effort.',
  'Strong and steady.',
  'What a way to move!'
];

export const sports:PracticeCopy={
  mascot:'/ninja-running.webp',
  mascotFor:item=>`/ninja-${item}.webp`,
  dailyMessage(day,{loggedToday}){
    if(loggedToday) return 'You moved today. Way to go!';
    if(isWeekend(day)) return 'Weekend adventure time, if you feel like it!';
    return pickFor(DAILY,day);
  },
  celebrateMessage:()=>random(CELEBRATE),
  celebrateTitle:name=>`${name} saved!`,
  preview:{sticker:'★',title:'This is what moving looks like!',message:'Log a workout or an adventure to earn the real thing.'},
  week:{done:'Sports logged',noun:'moving',empty:'Your sports days will show up here.'},
  journal:{
    note:'Each workout or adventure is saved on its own. Edits stay in the private backup history.',
    empty:['Your sports story starts here.','Log a workout, a run, a ride, or a day on the water. This is your space.']
  },
  today:{
    label:'Today’s sports',heading:'How did you move?',days:'Days with sports',
    intro:'Gym, running, mountain biking, snorkeling, or water skiing. Every bit counts.',
    empty:'Nothing saved for today yet. Add what you did when you’re ready.'
  },
  actions:{practice:['I moved!','Save what you did']},
  calendar:{heading:'My sports calendar',intro:'Each square is a day. More minutes make it darker. Tap a square to see what you did.'},
  form:{
    title:(_kind,editing)=>editing?'Make your sports note just right.':'How did you move today?',
    itemLegend:'What did you do?',
    focus:{label:'Anything to remember?',placeholder:'e.g. 2 miles, leg day, saw a turtle'},
    defaultMinutes:30,
    defaultItem:'last'
  }
};
