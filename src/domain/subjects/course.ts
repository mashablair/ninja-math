import {today,nextSchoolDay,finishDate,type Day} from '../dates.ts';
import type {Entry} from '../events.ts';
import type {CourseSubject,Unit} from './types.ts';

export interface BookProgress {
  id:number;
  lessons:number;
  // Completion per lesson (0, 0.25, 0.5, 0.75, 1). A partial check-in records the lesson's total, not an addition.
  progress:number[];
  // The day each lesson was finished; null for starting progress or not finished.
  doneOn:(Day|null)[];
  // Mom checked the lesson and every answer is right, and the day she did; null for checks before they were logged.
  checked:boolean[];
  checkedOn:(Day|null)[];
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
  // Finished lessons Mom hasn't checked yet, in order, with the days spent fixing mistakes on each.
  waiting:Waiting[];
  // Every unit across the books in order, and the one the next lesson is in.
  units:UnitProgress[];
  unit:UnitProgress|null;
}

export interface Waiting {book:number;lesson:number;finishedOn:Day|null;fixedOn:Day[]}

export function summarizeCourse(subject:CourseSubject,entries:readonly Entry[],asOf:Day=today()):CourseSummary {
  const progress=new Map<number,number[]>(subject.books.map(book=>[book.id,Array.from({length:book.lessons},(_,i)=>i<book.baseline?1:0)]));
  const completedOn=new Map<number,Day>(), doneOn=new Map<number,(Day|null)[]>(subject.books.map(book=>[book.id,Array.from({length:book.lessons},()=>null)]));
  const ordered=entries.filter(e=>e.subject===subject.id&&e.date!=null&&e.date<=asOf).sort((a,b)=>a.date!.localeCompare(b.date!)||a.seq-b.seq);
  // A fix-up is time on a finished lesson, not progress, so it neither moves a lesson nor uses up today's work slot.
  for(const e of ordered) {
    if(e.status==='skipped'||e.status==='fixed') continue;
    const book=Number(e[subject.bookField]??subject.books[0]!.id), lessons=progress.get(book);
    if(!lessons) continue;
    const wasComplete=lessons.every(p=>p===1);
    const n=Number(e.lesson)-1, dates=doneOn.get(book)!;
    if(Number(e.progress)===1&&lessons[n]!==1) dates[n]=e.date!;
    else if(Number(e.progress)<1) dates[n]=null;
    lessons[n]=Number(e.progress);
    const isComplete=lessons.every(p=>p===1);
    if(isComplete&&!wasComplete) completedOn.set(book,e.date!);
    else if(!isComplete) completedOn.delete(book);
  }
  const checked=new Map<number,boolean[]>(subject.books.map(book=>[book.id,Array.from({length:book.lessons},(_,i)=>i<(book.checkedThrough??0))]));
  const checkedOn=new Map<number,(Day|null)[]>(subject.books.map(book=>[book.id,Array.from({length:book.lessons},()=>null)]));
  for(const e of entries) {
    if(e.subject!=='checked'||e.of!==subject.id||!e.date||e.date>asOf) continue;
    const n=Number(e.lesson)-1, marks=checked.get(Number(e.book));
    if(!marks||n<0||n>=marks.length) continue;
    marks[n]=true;checkedOn.get(Number(e.book))![n]=e.date;
  }
  const loggedToday=ordered.some(e=>e.date===asOf&&e.status!=='fixed');
  const next=nextSchoolDay(asOf,!loggedToday);
  const books:Record<number,BookProgress>={};
  let previousFinish:Day|null=null;
  for(const book of subject.books) {
    const lessons=progress.get(book.id)!, total=lessons.reduce((a,b)=>a+b,0);
    // A later book starts the weekday after the previous one finishes, but never before the next work slot.
    const startsOn:Day=previousFinish?nextSchoolDay(previousFinish):next;
    const done=total===book.lessons;
    const finish:Day=done?(completedOn.get(book.id)||asOf):finishDate(startsOn>next?startsOn:next,Math.ceil(book.lessons-total));
    books[book.id]={id:book.id,lessons:book.lessons,progress:lessons,doneOn:doneOn.get(book.id)!,checked:checked.get(book.id)!,checkedOn:checkedOn.get(book.id)!,total,finished:lessons.filter(p=>p===1).length,completedOn:completedOn.get(book.id)??null,startsOn,finish,target:book.target};
    previousFinish=finish;
  }
  const activeBook=subject.books.find(book=>books[book.id]!.total<book.lessons)??subject.books.at(-1)!;
  const confirming=subject.books.find(book=>book.needsConfirmation?.length);
  const backlog=confirming?confirming.needsConfirmation!.filter(lesson=>books[confirming.id]!.progress[lesson-1]!<1):[];
  const activeProgress=books[activeBook.id]!.progress;
  const planned=activeBook.plannedFrom?activeProgress.findIndex((p,i)=>i>=activeBook.plannedFrom!-1&&p<1)+1:0;
  const nextLesson=planned||activeProgress.findIndex(p=>p<1)+1, units=unitProgress(subject,books);
  const unit=units.find(u=>u.book===activeBook.id&&nextLesson>=u.first&&nextLesson<=u.last)??null;
  const waiting=subject.books.flatMap(config=>{
    const book=books[config.id]!;
    return book.progress.flatMap((p,i):Waiting[]=>p===1&&!book.checked[i]?[{book:config.id,lesson:i+1,finishedOn:book.doneOn[i]??null,
      fixedOn:ordered.filter(e=>e.status==='fixed'&&Number(e[subject.bookField]??subject.books[0]!.id)===config.id&&Number(e.lesson)===i+1).map(e=>e.date!)}]:[]);
  });
  return {books,active:activeBook.id,nextLesson,backlog,backlogBook:confirming?.id??null,loggedToday,waiting,units,unit};
}
export const percentOf=(book:BookProgress)=>book.total===book.lessons?100:Math.min(99,Math.round(book.total*100/book.lessons));

// A unit's belt is earned when every lesson in it is finished, the assessment included, and Mom has checked each one,
// so a belt is never ahead of the work. Belts count on across books: Math 6 picks up after Math 5.
export interface UnitProgress extends Unit {book:number;number:number;belt:number;finished:number;checked:number;lessons:number;earned:boolean;earnedOn:Day|null}
function unitProgress(subject:CourseSubject,books:Record<number,BookProgress>):UnitProgress[] {
  let belt=0;
  return subject.books.flatMap(config=>(config.units??[]).map((unit,i)=>{
    const book=books[config.id]!, range=book.progress.slice(unit.first-1,unit.last);
    const checked=range.filter((p,j)=>p===1&&book.checked[unit.first-1+j]).length, earned=checked===range.length;
    const dates=[...book.doneOn.slice(unit.first-1,unit.last),...book.checkedOn.slice(unit.first-1,unit.last)].filter((d):d is Day=>!!d).sort();
    return {...unit,book:config.id,number:i+1,belt:belt++,finished:range.filter(p=>p===1).length,checked,lessons:range.length,earned,earnedOn:earned?dates.at(-1)??null:null};
  }));
}
// Lessons still to do before the unit's assessment, or in the whole unit when it has none. At zero, the assessment is next.
export const lessonsLeft=(unit:Unit,progress:readonly number[])=>progress.slice(unit.first-1,(unit.test?.[0]??unit.last+1)-1).filter(p=>p<1).length;
export const unitOf=(summary:CourseSummary,book:number,lesson:number)=>summary.units.find(u=>u.book===book&&lesson>=u.first&&lesson<=u.last)??null;

// Each lesson finished, on the day it was finished. Starting progress and lessons waiting for confirmation don't count,
// since they were done before check-ins. Finishing a lesson again after an edit counts it once.
export function completions(subject:CourseSubject,entries:readonly Entry[]):{date:Day;book:number;lesson:number}[] {
  const done=new Set<string>(), out:{date:Day;book:number;lesson:number}[]=[];
  const ordered=entries.filter(e=>e.subject===subject.id&&e.date!=null&&e.status==='complete').sort((a,b)=>a.date!.localeCompare(b.date!)||a.seq-b.seq);
  for(const e of ordered){
    const book=Number(e[subject.bookField]??subject.books[0]!.id), lesson=Number(e.lesson), config=subject.books.find(b=>b.id===book);
    if(!config||lesson<=config.baseline||config.needsConfirmation?.includes(lesson)||done.has(`${book}:${lesson}`)) continue;
    done.add(`${book}:${lesson}`);out.push({date:e.date!,book,lesson});
  }
  return out;
}
