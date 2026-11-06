import {today,mondayOf,type Day} from '../dates.ts';
import type {Entry} from '../events.ts';
import {activityCalendar,weekMinutes,type Calendar} from '../calendar.ts';
import type {PracticeSubject} from './types.ts';

export interface PracticeSummary {entries:Entry[];loggedToday:boolean;minutes:Record<string,number>;lessons:Entry[];monday:Day}

const logsOf=(subject:PracticeSubject,entries:readonly Entry[])=>entries.filter(e=>e.subject===subject.id);
export function summarizePractice(subject:PracticeSubject,entries:readonly Entry[],asOf:Day=today()):PracticeSummary {
  const ordered=logsOf(subject,entries).filter(e=>e.date!<=asOf).sort((a,b)=>a.date!.localeCompare(b.date!)||a.seq-b.seq);
  return {
    entries:ordered,
    loggedToday:ordered.some(e=>e.date===asOf),
    minutes:weekMinutes(ordered,subject.items,subject.itemField,asOf),
    lessons:ordered.filter(e=>e.kind==='lesson'),
    monday:mondayOf(asOf)
  };
}
export function practiceCalendar(subject:PracticeSubject,entries:readonly Entry[],item:string,asOf:Day=today()):Calendar {
  return activityCalendar(logsOf(subject,entries).filter(e=>e[subject.itemField]===item),asOf);
}

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
