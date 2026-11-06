// Encouraging words for music. Kind, specific, never guilt. No streaks, no invented achievements.
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
const pick=(list,seed)=>list[Math.abs(seed)%list.length];
const hash=text=>[...text].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7);
const random=list=>list[Math.floor(Math.random()*list.length)];

export function dailyMessage(day,{loggedToday}={}){
  if(loggedToday) return 'You made music today. That’s awesome!';
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();
  if(weekday===0||weekday===6) return 'Weekend music is a bonus. No pressure at all!';
  if(weekday===1&&hash(day)%2===0) return 'New week, fresh sounds. Let’s go!';
  return pick(DAILY,hash(day));
}
export const celebrateMessage=()=>random(CELEBRATE);
