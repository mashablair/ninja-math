import {today,mondayOf,monthOf,type Day} from '../dates.ts';
import type {Entry} from '../events.ts';
import {OTHER,type PracticeSubject} from './types.ts';

export interface PracticeSummary {
  entries:Entry[];loggedToday:boolean;lessons:Entry[];monday:Day;
  // Monday through today: only what she did, never zeros.
  week:Totals;
  goal:number|null;
  badges:Badge[];
}

const logsOf=(subject:PracticeSubject,entries:readonly Entry[])=>entries.filter(e=>e.subject===subject.id);
export function summarizePractice(subject:PracticeSubject,entries:readonly Entry[],asOf:Day=today()):PracticeSummary {
  const ordered=logsOf(subject,entries).filter(e=>e.date!<=asOf).sort((a,b)=>a.date!.localeCompare(b.date!)||a.seq-b.seq);
  return {
    entries:ordered,
    loggedToday:ordered.some(e=>e.date===asOf),
    lessons:ordered.filter(e=>e.kind==='lesson'),
    monday:mondayOf(asOf),
    week:totals(subject,ordered,mondayOf(asOf),asOf),
    goal:goalOf(subject,entries),
    badges:badgesFor(subject,ordered)
  };
}

// "Something else" entries count as their own activity per name, so swimming and dance are two.
export const activityKey=(subject:PracticeSubject,entry:Entry)=>{
  const item=String(entry[subject.itemField]);
  return item===OTHER?`${OTHER}:${String(entry.name??'').trim().toLowerCase()}`:item;
};
export interface Activity {item:string;name?:string;minutes:number;days:number}
export interface Totals {days:number;minutes:number;activities:Activity[]}
// What she did from one day through another, listed in the subject's order with anything else last.
export function totals(subject:PracticeSubject,logs:readonly Entry[],from:Day,to:Day):Totals {
  const within=logs.filter(e=>e.subject===subject.id&&e.date!>=from&&e.date!<=to);
  const order=subject.items.map(item=>item.id), found=new Map<string,Activity&{dates:Set<Day>}>();
  for(const entry of within){
    const key=activityKey(subject,entry), item=String(entry[subject.itemField]);
    const activity=found.get(key)??{item,...(item===OTHER?{name:String(entry.name??'')}:{}),minutes:0,days:0,dates:new Set<Day>()};
    activity.minutes+=Number(entry.minutes);activity.dates.add(entry.date!);
    found.set(key,activity);
  }
  const rank=(item:string)=>{const i=order.indexOf(item);return i<0?order.length:i;};
  const activities=[...found.values()].sort((a,b)=>rank(a.item)-rank(b.item)).map(({dates,...a})=>({...a,days:dates.size}));
  return {days:new Set(within.map(e=>e.date)).size,minutes:activities.reduce((sum,a)=>sum+a.minutes,0),activities};
}

// Backfilled logs can come before the subject's start, so calendars reach back to the earliest one.
export const firstMonth=(subject:PracticeSubject,logs:readonly Entry[])=>
  logs.filter(e=>e.subject===subject.id).map(e=>monthOf(e.date!)).reduce((first,m)=>m<first?m:first,monthOf(subject.start));

export const goalId=(subject:PracticeSubject)=>`goal-${subject.id}`;
export function goalOf(subject:PracticeSubject,entries:readonly Entry[]):number|null {
  if(!subject.goal) return null;
  const goal=entries.findLast(e=>e.subject==='goal'&&e.of===subject.id);
  return goal?Number(goal.days):null;
}

// Badges are worked out from what she logged, never stored, so each one is something she really did.
// first: the first time for each activity; mix: several different activities in one Monday–Sunday week;
// all: every activity on the list at least once; month: any month with something logged in it.
export type BadgeKind='first'|'mix'|'all'|'month';
export interface Badge {id:string;kind:BadgeKind;item?:string;month?:string;earned:Day|null}
export function badgesFor(subject:PracticeSubject,logs:readonly Entry[]):Badge[] {
  if(!subject.badges) return [];
  const ordered=logs.filter(e=>e.subject===subject.id).sort((a,b)=>a.date!.localeCompare(b.date!)||a.seq-b.seq);
  const first=new Map<string,Day>(), months=new Map<string,Day>(), weeks=new Map<Day,Set<string>>();
  let mix:Day|null=null;
  for(const entry of ordered){
    const item=String(entry[subject.itemField]), week=mondayOf(entry.date!);
    if(!first.has(item)) first.set(item,entry.date!);
    if(!months.has(monthOf(entry.date!))) months.set(monthOf(entry.date!),entry.date!);
    const kinds=weeks.get(week)??new Set<string>();
    kinds.add(activityKey(subject,entry));weeks.set(week,kinds);
    if(!mix&&kinds.size>=subject.badges.mix) mix=entry.date!;
  }
  const items=[...subject.items.map(item=>item.id),...(subject.other?[OTHER]:[])];
  const listed=subject.items.map(item=>first.get(item.id));
  return [
    ...items.map(item=>({id:`first-${item}`,kind:'first' as const,item,earned:first.get(item)??null})),
    {id:'mix',kind:'mix',earned:mix},
    {id:'all',kind:'all',earned:listed.every(Boolean)?listed.sort().at(-1)!:null},
    ...[...months].map(([month,day])=>({id:`month-${month}`,kind:'month' as const,month,earned:day}))
  ];
}
export const earnedBadges=(badges:readonly Badge[])=>badges.filter(badge=>badge.earned);

// Songs are append-only 'song' entries layered over the starting songs; archiving saves the song again.
export interface BankSong {id:string;item:string;title:string;archived:boolean;seq:number}
export function songBank(subject:PracticeSubject,entries:readonly Entry[]):BankSong[] {
  const field=subject.itemField;
  const songs=new Map<string,BankSong>((subject.songs?.starting??[]).map(song=>[song.id,{id:song.id,item:String(song[field]),title:song.title,archived:false,seq:0}]));
  for(const entry of entries) if(entry.subject==='song') songs.set(entry.id,{id:entry.id,item:String(entry[field]),title:String(entry.title),archived:!!entry.archived,seq:entry.seq});
  return [...songs.values()];
}
export function songsFor(bank:readonly BankSong[],item:string):BankSong[] {
  return bank.filter(song=>song.item===item).sort((a,b)=>a.title.localeCompare(b.title,'en',{sensitivity:'base'}));
}
