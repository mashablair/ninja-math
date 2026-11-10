import {useId,type CSSProperties} from 'react';
import type {CourseSummary,UnitProgress} from '../../domain/subjects/course.ts';
import type {CourseSubject} from '../../domain/subjects/types.ts';
import {cx,plural} from '../format.ts';
import {beltName} from '../messages/rewards.ts';
import {bookLabel,lessonTitle} from '../subjects.ts';
import {useUi} from '../state/ui.tsx';
import {BeltIcon} from './Icons.tsx';

export interface LessonState {state:string;label:string}
// What a lesson looks like on the path and in the sticker grid.
export function lessonState(subject:CourseSubject,s:CourseSummary,book:number,n:number):LessonState {
  const p=s.books[book]!.progress[n-1]!, check=book===s.backlogBook&&s.backlog.includes(n), isToday=book===s.active&&n===s.nextLesson&&p<1;
  return {state:p===1?'done':p>0?'part':check?'check':isToday?'today':'',label:p===1?'finished':p>0?`${p*100}% done`:check?'needs a check':isToday?'today’s lesson':'coming up'};
}
const ROW=6;
// One unit as a winding path: rows of six that turn at each end, a star on the review, and the belt at the end.
function UnitPath({subject,s,unit,onLesson}:{subject:CourseSubject;s:CourseSummary;unit:UnitProgress;onLesson(n:number):void}) {
  const ui=useUi(), stops:(number|'belt')[]=[...Array.from({length:unit.last-unit.first+1},(_,i)=>unit.first+i),'belt'];
  const rows=Array.from({length:Math.ceil(stops.length/ROW)},(_,r)=>stops.slice(r*ROW,r*ROW+ROW));
  return <div className="path">{rows.map((row,r)=><div key={r} className={cx('path-row',r%2===1&&'back',r===rows.length-1&&'last')} style={{'--n':row.length} as CSSProperties}>
    {row.map(stop=>{
      if(stop==='belt') return <span key="belt" className={cx('path-belt',unit.earned&&'earned')} title={beltName(unit.belt)}><BeltIcon belt={unit.belt} size={44}/></span>;
      const {state,label}=lessonState(subject,s,unit.book,stop), name=lessonTitle(subject,unit.book,stop);
      const kind=unit.test?.includes(stop)?'test':unit.review===stop?'review':unit.projects?.includes(stop)?'project':'';
      const earned=ui.earned?.subject===subject.id&&ui.earned.book===unit.book&&ui.earned.lessons.includes(stop);
      return <span key={stop} className="path-stop">
        {state==='today'&&<img className="path-ninja" src="/peaceful-ninja.png" alt="" width="40" height="40"/>}
        <button type="button" className={cx('lesson','path-node',state,kind,earned&&'just-earned')} title={name?`Lesson ${stop}: ${name}`:`Lesson ${stop}`}
          aria-label={`${bookLabel(subject,unit.book)}, lesson ${stop}, ${label}`} onClick={()=>onLesson(stop)}>
          {stop}{kind==='review'&&<b aria-hidden="true">★</b>}{kind==='project'&&<b aria-hidden="true">✎</b>}
        </button>
      </span>;
    })}
  </div>)}</div>;
}

// The book as units. The unit she's in is open; the others fold up and open with a tap.
export function LessonPath({subject,s,book,onLesson}:{subject:CourseSubject;s:CourseSummary;book:number;onLesson(n:number):void}) {
  const units=s.units.filter(u=>u.book===book), hint=useId();
  const next=book===s.active?s.nextLesson:null, nextName=next&&lessonTitle(subject,book,next);
  return <div className="units" aria-describedby={hint}>
    {units.map(unit=>{
      const current=s.unit===unit, belt=beltName(unit.belt);
      return <details key={unit.number} className={cx('unit',current&&'current',unit.earned&&'earned')} open={current}>
        <summary>
          <BeltIcon belt={unit.belt} size={40}/>
          <span className="unit-name"><strong>Unit {unit.number}</strong><span>{belt}</span></span>
          <span className="unit-state">{unit.earned?'Belt earned ✓':unit.finished?`${unit.finished} of ${unit.lessons}`:'Coming up'}</span>
        </summary>
        {current&&next&&<p className="unit-next">Next up: <strong>Lesson {next}{nextName?` · ${nextName}`:''}</strong></p>}
        <UnitPath subject={subject} s={s} unit={unit} onLesson={onLesson}/>
      </details>;
    })}
    <p id={hint} className="small muted">Tap a lesson to check it in. {units.some(u=>u.review)?'★ is the unit review. ':''}{units.some(u=>u.projects)?'✎ is a project lesson. ':''}Finish every lesson in a unit{units.some(u=>u.test)?', assessment too,':''} to earn its belt. {plural(units.filter(u=>u.earned).length,'belt')} so far.</p>
  </div>;
}
