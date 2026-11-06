// Encouraging words for sports. Kind, specific, never guilt. No streaks, no invented achievements.
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
const pick=(list,seed)=>list[Math.abs(seed)%list.length];
const hash=text=>[...text].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7);
const random=list=>list[Math.floor(Math.random()*list.length)];

export function dailyMessage(day,{loggedToday}={}){
  if(loggedToday) return 'You moved today. Way to go!';
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();
  if(weekday===0||weekday===6) return 'Weekend adventure time, if you feel like it!';
  return pick(DAILY,hash(day));
}
export const celebrateMessage=()=>random(CELEBRATE);
