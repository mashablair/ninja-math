// Encouraging words. Kind, specific, never guilt. No streaks, no invented achievements.
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
  if(loggedToday) return 'You already did math today. That’s awesome!';
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();
  if(weekday===0||weekday===6) return 'Weekend math is a bonus. No pressure at all!';
  if(weekday===1&&hash(day)%2===0) return 'New week, fresh start. Let’s go!';
  return pick(DAILY,hash(day));
}
export function bookCheer(percent){
  if(percent>=100) return 'Book complete. Amazing!';
  if(percent>=90) return 'The finish line is so close!';
  if(percent>=50) return 'More than halfway there!';
  if(percent>=25) return 'Building momentum!';
  return 'A great start!';
}
export function celebrateMessage({finished,book,bookDone,percentBefore,percentAfter}){
  if(bookDone) return `You finished Math ${book}! Every single lesson. That’s huge.`;
  if(percentBefore<50&&percentAfter>=50) return `You’re more than halfway through Math ${book}!`;
  if(finished%10===0) return `That’s ${finished} lessons in Math ${book}. A big milestone!`;
  if(120-finished<=10) return `Only ${120-finished} lessons left in Math ${book}!`;
  return random(CELEBRATE);
}
export const partialMessage=()=>random(PARTIAL);
export const breakMessage=()=>random(BREAK);
