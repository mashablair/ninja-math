// Encouraging words for English. Kind, specific, never guilt. No streaks, no invented achievements.
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
const pick=(list,seed)=>list[Math.abs(seed)%list.length];
const hash=text=>[...text].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7);
const random=list=>list[Math.floor(Math.random()*list.length)];

export function dailyMessage(day,{loggedToday,lastStatus}={}){
  if(loggedToday&&lastStatus==='skipped') return 'Rest is part of learning. See you next time!';
  if(loggedToday) return 'You already did English today. That’s awesome!';
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();
  if(weekday===0||weekday===6) return 'Weekend English is a bonus. No pressure at all!';
  if(weekday===1&&hash(day)%2===0) return 'New week, fresh start. Let’s go!';
  return pick(DAILY,hash(day));
}
export function bookCheer(percent){
  if(percent>=100) return 'English 5 complete. Amazing!';
  if(percent>=90) return 'The finish line is so close!';
  if(percent>=50) return 'More than halfway there!';
  if(percent>=25) return 'Building momentum!';
  return 'A great start!';
}
export function celebrateMessage({finished,done,percentBefore,percentAfter}){
  if(done) return 'You finished English 5! Every single lesson. That’s huge.';
  if(percentBefore<50&&percentAfter>=50) return 'You’re more than halfway through English 5!';
  if(finished%10===0) return `That’s ${finished} lessons in English 5. A big milestone!`;
  if(120-finished<=10) return `Only ${120-finished} lessons left in English 5!`;
  return random(CELEBRATE);
}
export const partialMessage=()=>random(PARTIAL);
export const breakMessage=()=>random(BREAK);
