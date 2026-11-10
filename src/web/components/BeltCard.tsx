import {useId} from 'react';
import {percentOf,type CourseSummary} from '../../domain/subjects/course.ts';
import type {CourseSubject} from '../../domain/subjects/types.ts';
import {pretty} from '../../domain/dates.ts';
import {cx} from '../format.ts';
import {beltName,belts} from '../messages/rewards.ts';
import {bookLabel} from '../subjects.ts';
import {BeltIcon} from './Icons.tsx';

// The unit she's in and the belt it earns, then every belt in the subject: earned ones in color.
export function BeltCard({subject,s}:{subject:CourseSubject;s:CourseSummary}) {
  const title=useId(), unit=s.unit!, book=s.books[s.active]!, belt=beltName(unit.belt);
  // Lessons still to do before the assessment; at zero the assessment is next.
  const left=book.progress.slice(unit.first-1,unit.test[0]!-1).filter(p=>p<1).length;
  return <section className="card belt-card" aria-labelledby={title}>
    <span className="label">Unit {unit.number} of {bookLabel(subject,unit.book)}</span>
    <div className="belt-goal"><BeltIcon belt={unit.belt} size={72}/><h3 id={title}>{belt}</h3></div>
    <div className="belt-bar" role="img" aria-label={`${unit.finished} of ${unit.lessons} lessons`}><span style={{width:`${unit.finished/unit.lessons*100}%`}}/></div>
    <p className="belt-count"><strong>{unit.finished} of {unit.lessons} lessons</strong></p>
    <p className="muted">{belts.toGo(left,belt)}</p>
    <ul className="belt-row" aria-label="My belts">{s.units.map(u=><li key={`${u.book}-${u.number}`} className={cx(u.earned?'earned':'locked')}
      title={`${beltName(u.belt)}: ${u.earned?u.earnedOn?`earned ${pretty(u.earnedOn)}`:'earned':'not yet'}`}>
      <BeltIcon belt={u.belt} size={36}/><span className="visually-hidden">{beltName(u.belt)}, {u.earned?'earned':'not earned yet'}</span>
    </li>)}</ul>
    <p className="small muted">{bookLabel(subject,s.active)}: {book.finished} of {book.lessons} lessons · {percentOf(book)}%</p>
  </section>;
}
