import {percentOf,type CourseSummary} from '../domain/subjects/course.ts';
import {earnedBadges,type PracticeSummary} from '../domain/subjects/practice.ts';
import type {PracticeEntry} from '../domain/events.ts';
import type {CourseSubject,PracticeSubject} from '../domain/subjects/types.ts';
import {badgeLook} from './badges.ts';
import {bookLabel,courseCopy,entryLabel,itemImage,itemName,itemOf,practiceCopy} from './subjects.ts';
import type {Celebration} from './state/ui.tsx';

export function courseCelebration(subject:CourseSubject,book:number,lessons:number[],before:CourseSummary,after:CourseSummary):Celebration {
  const was=before.books[book]!, now=after.books[book]!, bookDone=now.total===now.lessons, many=lessons.length>1;
  const percentAfter=percentOf(now);
  return {
    sticker:bookDone?'★':many?lessons.length:lessons[0]!,
    title:bookDone?`${bookLabel(subject,book)} complete!`:many?`${lessons.length} lessons checked off!`:`Lesson ${lessons[0]} is done!`,
    message:many&&!bookDone?'Loose ends, all tied up. Beautiful work!':courseCopy(subject).celebrateMessage({finished:now.finished,book,bookDone,percentBefore:percentOf(was),percentAfter}),
    label:bookLabel(subject,book),percent:percentAfter,count:`${now.finished} of ${now.lessons} lessons`,
    mascot:courseCopy(subject).mascot,sound:subject.id,big:bookDone
  };
}
export function practiceCelebration(subject:PracticeSubject,item:string,minutes:number,kind:'practice'|'lesson'):Celebration {
  const copy=practiceCopy(subject);
  return {sticker:minutes,title:copy.celebrateTitle(itemName(subject,item),kind),message:copy.celebrateMessage(),mascot:copy.mascotFor?.(item)??copy.mascot,sound:subject.id};
}
// The month layout: the ninja dashes across, then any badge just earned and her own weekly goal.
export function moveCelebration(subject:PracticeSubject,entry:PracticeEntry,before:PracticeSummary,after:PracticeSummary):Celebration {
  const copy=practiceCopy(subject), goal=after.goal, days=after.week.days;
  const fresh=earnedBadges(after.badges).filter(badge=>!before.badges.some(old=>old.id===badge.id&&old.earned));
  const reached=goal!=null&&before.week.days<goal&&days>=goal;
  return {
    sticker:entry.minutes,unit:'min',title:`${entryLabel(subject,entry)} saved!`,
    message:reached?copy.goal!.celebrate:copy.celebrateMessage(),
    mascot:itemImage(subject,itemOf(subject,entry)),round:true,sound:subject.id,big:reached,
    ...(fresh[0]&&{badge:{...badgeLook(subject,fresh[0]),more:fresh.length-1}}),
    ...(goal!=null&&{label:'Weekly goal',value:`${Math.min(days,goal)} of ${goal} days`,percent:Math.min(100,Math.round(days/goal*100)),
      count:days>=goal?copy.goal!.reached:copy.goal!.left(goal-days)})
  };
}
// Tweaks › Preview shows the real thing's shape with today's numbers, without saving anything.
export function previewCelebration(subject:CourseSubject|PracticeSubject,summary:CourseSummary|PracticeSummary):Celebration {
  if(subject.type==='practice'){const copy=practiceCopy(subject);return {...copy.preview,mascot:copy.mascot,round:subject.layout==='month',sound:subject.id};}
  const s=summary as CourseSummary, book=s.books[s.active]!;
  return {
    sticker:s.nextLesson,title:'This is what finishing looks like!',message:'Finish a lesson to earn the real thing.',
    label:bookLabel(subject,s.active),percent:percentOf(book),count:`${book.finished} of ${book.lessons} lessons`,
    mascot:courseCopy(subject).mascot,sound:subject.id
  };
}
