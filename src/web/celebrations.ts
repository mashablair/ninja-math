import type {LeagueSummary} from '../domain/league.ts';
import {lessonsLeft,percentOf,unitOf,type CourseSummary} from '../domain/subjects/course.ts';
import {earnedBadges,type PracticeSummary} from '../domain/subjects/practice.ts';
import type {PracticeEntry} from '../domain/events.ts';
import type {CourseSubject,PracticeSubject} from '../domain/subjects/types.ts';
import {badgeLook} from './badges.ts';
import {beltName,belts,league as leagueCopy,leagueName} from './messages/rewards.ts';
import {STUDENT,bookLabel,courseCopy,entryLabel,itemImage,itemOf,practiceCopy} from './subjects.ts';
import type {Celebration} from './state/ui.tsx';

// A lesson sticker, with the unit's belt as the progress when the book has units. Finishing the unit assessment
// earns the belt; reaching 5 + 5 for the week says she's moving up a league.
export function courseCelebration(subject:CourseSubject,book:number,lessons:number[],before:CourseSummary,after:CourseSummary,
  league?:{before:LeagueSummary|null;after:LeagueSummary|null}):Celebration {
  const was=before.books[book]!, now=after.books[book]!, bookDone=now.total===now.lessons, many=lessons.length>1;
  const percentAfter=percentOf(now), copy=courseCopy(subject);
  const unit=unitOf(after,book,lessons.at(-1)!), belt=unit&&!before.units.find(u=>u.book===unit.book&&u.number===unit.number)?.earned&&unit.earned;
  const l=league?.after, reached=!!l&&!!league.before&&league.before.week.points<l.goal&&l.week.points>=l.goal&&!l.week.off;
  const next=l&&l.league<STUDENT.league!.tiers-1?leagueName(l.league+1):null;
  const message=belt?belts.earned(unit.number,beltName(unit.belt))
    :reached?leagueCopy.goalReached(next)
    :many&&!bookDone?'Loose ends, all tied up. Beautiful work!'
    :copy.celebrateMessage({finished:now.finished,book,bookDone,percentBefore:percentOf(was),percentAfter});
  const left=unit?lessonsLeft(unit,now.progress):0;
  return {
    sticker:bookDone||belt?'★':many?lessons.length:lessons[0]!,
    title:bookDone?`${bookLabel(subject,book)} complete!`:belt?`${beltName(unit.belt)}!`:many?`${lessons.length} lessons checked off!`:`Lesson ${lessons[0]} is done!`,
    message,mascot:copy.mascot,sound:subject.id,big:bookDone||!!belt||reached,
    ...(belt&&{badge:{belt:unit.belt,name:beltName(unit.belt),detail:`Unit ${unit.number} of ${bookLabel(subject,book)}`,more:0}}),
    ...(unit&&!bookDone
      ?{label:`Unit ${unit.number} · ${beltName(unit.belt)}`,percent:Math.round(unit.finished/unit.lessons*100),value:`${unit.finished} of ${unit.lessons}`,
        count:unit.earned?`Unit ${unit.number} complete!`:belts.toGo(left,beltName(unit.belt))}
      :{label:bookLabel(subject,book),percent:percentAfter,count:`${now.finished} of ${now.lessons} lessons`})
  };
}
// The ninja dashes across, then any badge just earned and her own weekly goal.
export function practiceCelebration(subject:PracticeSubject,entry:PracticeEntry,before:PracticeSummary,after:PracticeSummary):Celebration {
  const copy=practiceCopy(subject), goal=after.goal, days=after.week.days;
  const fresh=earnedBadges(after.badges).filter(badge=>!before.badges.some(old=>old.id===badge.id&&old.earned));
  const reached=goal!=null&&before.week.days<goal&&days>=goal;
  return {
    sticker:entry.minutes,unit:'min',title:copy.celebrateTitle(entryLabel(subject,entry),entry.kind??'practice'),
    message:reached?copy.goal!.celebrate:copy.celebrateMessage(),
    mascot:itemImage(subject,itemOf(subject,entry)),round:true,sound:subject.id,big:reached,
    ...(fresh[0]&&{badge:{...badgeLook(subject,fresh[0]),more:fresh.length-1}}),
    ...(goal!=null&&{label:'Weekly goal',value:`${Math.min(days,goal)} of ${goal} days`,percent:Math.min(100,Math.round(days/goal*100)),
      count:days>=goal?copy.goal!.reached:copy.goal!.left(goal-days)})
  };
}
// Tweaks › Preview shows the real thing's shape with today's numbers, without saving anything.
export function previewCelebration(subject:CourseSubject|PracticeSubject,summary:CourseSummary|PracticeSummary):Celebration {
  if(subject.type==='practice'){const copy=practiceCopy(subject);return {...copy.preview,mascot:copy.mascot,round:true,sound:subject.id};}
  const s=summary as CourseSummary, book=s.books[s.active]!;
  return {
    sticker:s.nextLesson,title:'This is what finishing looks like!',message:'Finish a lesson to earn the real thing.',
    label:bookLabel(subject,s.active),percent:percentOf(book),count:`${book.finished} of ${book.lessons} lessons`,
    mascot:courseCopy(subject).mascot,sound:subject.id
  };
}
