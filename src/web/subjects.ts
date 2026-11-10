import {NINJA} from '../domain/student.ts';
import type {Entry,PracticeEntry} from '../domain/events.ts';
import {OTHER,type CourseSubject,type Item,type PracticeSubject,type Subject} from '../domain/subjects/types.ts';
import type {BankSong} from '../domain/subjects/practice.ts';
import type {CourseCopy,PracticeCopy} from './messages/types.ts';
import {duration} from './format.ts';
import {math} from './messages/math.ts';
import {english} from './messages/english.ts';
import {music} from './messages/music.ts';
import {sports} from './messages/sports.ts';

// The page shows one student. Phase 4 loads the student and their subjects from the database.
export const STUDENT=NINJA;
const COURSE:Record<string,CourseCopy>={math,english};
const PRACTICE:Record<string,PracticeCopy>={music,sports};
export const courseCopy=(subject:CourseSubject)=>COURSE[subject.id]!;
export const practiceCopy=(subject:PracticeSubject)=>PRACTICE[subject.id]!;

export const subjectById=(id:string|null|undefined):Subject|undefined=>STUDENT.subjects.find(subject=>subject.id===id);
export const entriesOf=(subject:Subject,entries:readonly Entry[])=>entries.filter(entry=>entry.subject===subject.id);
export const bookLabel=(subject:CourseSubject,book:number)=>`${subject.name} ${book}`;
// The lesson's name from the book's table of contents, when we have it.
export const lessonTitle=(subject:CourseSubject,book:number,lesson:number)=>subject.books.find(b=>b.id===book)?.titles?.[lesson-1]??'';
export const bookOf=(subject:CourseSubject,entry:Entry)=>Number(entry[subject.bookField]??subject.books[0]!.id);
export const itemOf=(subject:PracticeSubject,entry:Entry)=>String(entry[subject.itemField]);
export const itemName=(subject:PracticeSubject,id:string)=>id===OTHER&&subject.other?practiceCopy(subject).other!.name:subject.items.find(item=>item.id===id)?.name??subject.name;
// The listed items, then "Something else" when the subject has it.
export const choicesOf=(subject:PracticeSubject):Item[]=>[...subject.items,...(subject.other?[{id:OTHER,name:itemName(subject,OTHER)}]:[])];
export const itemImage=(subject:PracticeSubject,id:string)=>id===OTHER&&subject.other?practiceCopy(subject).other!.image:`/ninja-${id}.webp`;
// One of the subject's items, for counts: "3 different sports".
export const itemNoun=(subject:PracticeSubject)=>subject.labels.items.replace(/s$/,'');
// What she did, in her words for "Something else".
export const entryLabel=(subject:PracticeSubject,entry:PracticeEntry)=>itemOf(subject,entry)===OTHER&&entry.name?entry.name:itemName(subject,itemOf(subject,entry));
export const kindLabel=(entry:PracticeEntry)=>entry.kind==='lesson'?'Lesson with teacher':'Practice';
// What was played or done: song names from the bank, then the free text.
export const practiceText=(entry:PracticeEntry,bank:readonly BankSong[])=>
  [...(entry.songs??[]).map(id=>bank.find(song=>song.id===id)?.title).filter(Boolean),entry.focus].filter(Boolean).join(' · ');
// One line under the name: a teacher lesson says so, then the time and what was played or done.
export const entryDetail=(subject:PracticeSubject,entry:PracticeEntry,bank:readonly BankSong[])=>
  [subject.lessons&&entry.kind==='lesson'?kindLabel(entry):'',duration(entry.minutes),practiceText(entry,bank)].filter(Boolean).join(' · ');
// The bank's owner; songs are entries of their own.
export const SONG_SUBJECT=STUDENT.subjects.find((s):s is PracticeSubject=>s.type==='practice'&&!!s.songs);
