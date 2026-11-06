import {today,nextSchoolDay,finishDate,type Day} from '../dates.ts';
import type {Entry} from '../events.ts';
import type {CourseSubject} from './types.ts';

export interface BookProgress {
  id:number;
  lessons:number;
  // Completion per lesson (0, 0.25, 0.5, 0.75, 1). A partial check-in records the lesson's total, not an addition.
  progress:number[];
  total:number;
  finished:number;
  completedOn:Day|null;
  startsOn:Day;
  finish:Day;
  target:Day;
}
export interface CourseSummary {
  books:Record<number,BookProgress>;
  active:number;
  nextLesson:number;
  backlog:number[];
  backlogBook:number|null;
  loggedToday:boolean;
}

export function summarizeCourse(subject:CourseSubject,entries:readonly Entry[],asOf:Day=today()):CourseSummary {
  const progress=new Map<number,number[]>(subject.books.map(book=>[book.id,Array.from({length:book.lessons},(_,i)=>i<book.baseline?1:0)]));
  const completedOn=new Map<number,Day>();
  const ordered=entries.filter(e=>e.subject===subject.id&&e.date!=null&&e.date<=asOf).sort((a,b)=>a.date!.localeCompare(b.date!)||a.seq-b.seq);
  for(const e of ordered) {
    if(e.status==='skipped') continue;
    const book=Number(e[subject.bookField]??subject.books[0]!.id), lessons=progress.get(book);
    if(!lessons) continue;
    const wasComplete=lessons.every(p=>p===1);
    lessons[Number(e.lesson)-1]=Number(e.progress);
    const isComplete=lessons.every(p=>p===1);
    if(isComplete&&!wasComplete) completedOn.set(book,e.date!);
    else if(!isComplete) completedOn.delete(book);
  }
  const loggedToday=ordered.some(e=>e.date===asOf);
  const next=nextSchoolDay(asOf,!loggedToday);
  const books:Record<number,BookProgress>={};
  let previousFinish:Day|null=null;
  for(const book of subject.books) {
    const lessons=progress.get(book.id)!, total=lessons.reduce((a,b)=>a+b,0);
    // A later book starts the weekday after the previous one finishes, but never before the next work slot.
    const startsOn:Day=previousFinish?nextSchoolDay(previousFinish):next;
    const done=total===book.lessons;
    const finish:Day=done?(completedOn.get(book.id)||asOf):finishDate(startsOn>next?startsOn:next,Math.ceil(book.lessons-total));
    books[book.id]={id:book.id,lessons:book.lessons,progress:lessons,total,finished:lessons.filter(p=>p===1).length,completedOn:completedOn.get(book.id)??null,startsOn,finish,target:book.target};
    previousFinish=finish;
  }
  const activeBook=subject.books.find(book=>books[book.id]!.total<book.lessons)??subject.books.at(-1)!;
  const confirming=subject.books.find(book=>book.needsConfirmation?.length);
  const backlog=confirming?confirming.needsConfirmation!.filter(lesson=>books[confirming.id]!.progress[lesson-1]!<1):[];
  const activeProgress=books[activeBook.id]!.progress;
  const planned=activeBook.plannedFrom?activeProgress.findIndex((p,i)=>i>=activeBook.plannedFrom!-1&&p<1)+1:0;
  return {books,active:activeBook.id,nextLesson:planned||activeProgress.findIndex(p=>p<1)+1,backlog,backlogBook:confirming?.id??null,loggedToday};
}
export const percentOf=(book:BookProgress)=>book.total===book.lessons?100:Math.min(99,Math.round(book.total*100/book.lessons));
