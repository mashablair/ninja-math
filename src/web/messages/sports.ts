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
    label:'Today’s sports',heading:'What did you do today?',days:'Days with sports',
    intro:'Tap a sport to save it. Every bit of moving counts.',
    empty:'Nothing saved for today yet. Add what you did when you’re ready.',
    done:'Moved today ✓',saved:'Saved today'
  },
  actions:{practice:['I moved!','Save what you did']},
  calendar:{heading:'My sports calendar',intro:'Each square is a day. More minutes make it darker. Tap a square to see what you did.'},
  form:{
    title:(_kind,editing)=>editing?'Make your sports note just right.':'How did you move today?',
    itemLegend:'What did you do?',
    focus:{label:'Anything to remember?',placeholder:'e.g. 2 miles, leg day, saw a turtle'},
    defaultMinutes:30,
    defaultItem:'last',
    about:{gym:'your gym time',running:'your run','mountain-biking':'your ride',snorkeling:'your snorkeling','water-skiing':'your water skiing',other:'what you did'},
    picked:name=>`Already picked, because you tapped ${name}. You can still switch.`
  },
  // A placeholder until the something-else ninja arrives.
  other:{name:'Something else',image:'/peaceful-ninja.png',label:'What did you do?',placeholder:'e.g. Swimming, dance, walking the dog'},
  feel:{tough:'Tough',good:'Good',amazing:'Amazing!'},
  month:{
    intro:'Tap a day to see what you did.',
    empty:month=>`Nothing saved in ${month} yet. Your ninjas will show up here.`,
    nothing:day=>`Nothing saved on ${day}. Rest days are part of it too.`
  },
  thisWeek:{empty:'Nothing saved this week yet. Any kind of moving counts!'},
  goal:{
    none:'Want a goal? Pick how many days you’d like to move each week.',set:'Set a goal',
    title:'My weekly goal',question:'How many days do you want to move each week?',
    hint:'It’s your goal. Change it any time, or have no goal at all.',
    progress:(days,goal)=>days?`${days} of ${goal} days. ${sports.goal!.left(goal-days)}`:`Any day you move counts toward ${goal}.`,
    left:days=>`${days} more ${days===1?'day':'days'} to go.`,
    reached:'You reached your goal this week!',
    celebrate:'You reached your goal this week! That’s your own goal, and you did it.'
  },
  badges:{
    intro:earned=>earned?`${earned} ${earned===1?'badge':'badges'} so far. Each one is something you really did.`:'Badges show up as you move. Here’s what you can earn.',
    first:{
      gym:['Gym ninja','First gym day','Go to the gym to earn this'],
      running:['Runner','First run','Go for a run to earn this'],
      'mountain-biking':['Trail rider','First bike ride','Go mountain biking to earn this'],
      snorkeling:['Reef explorer','First snorkel','Go snorkeling to earn this'],
      'water-skiing':['Wave rider','First water skiing','Go water skiing to earn this'],
      other:['Something new','First something else','Try something else']
    },
    mix:['Mix it up','3 sports in one week','3 different sports in a week'],
    all:['All-rounder','Tried all five sports','Try all five sports'],
    month:name=>[name,`Moved in ${name}`]
  }
};
