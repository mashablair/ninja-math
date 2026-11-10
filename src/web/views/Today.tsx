import type {Subject} from '../../domain/subjects/types.ts';
import {SubjectTabs} from '../components/SubjectTabs.tsx';
import {todayLabel} from '../format.ts';
import {STUDENT,courseCopy,entriesOf,practiceCopy} from '../subjects.ts';
import {useData,useToday} from '../state/data.tsx';
import {CourseToday} from './CourseToday.tsx';
import {PracticeToday} from './PracticeToday.tsx';

function useDailyMessage(subject:Subject) {
  const {entries,loaded}=useData(), day=useToday();
  if(!loaded) return 'Small steps add up to big things.';
  const todays=entriesOf(subject,entries).filter(entry=>entry.date===day);
  const copy=subject.type==='course'?courseCopy(subject):practiceCopy(subject);
  return copy.dailyMessage(day,{loggedToday:todays.length>0,lastStatus:todays.at(-1)?.status as string|undefined});
}

// Ninja's screen. No dates, targets, or forecasts here; those live in the plan.
export function Today({subject,onSubject,book,onBook}:{subject:Subject;onSubject(id:string):void;book:number|undefined;onBook(book:number):void}) {
  const {loaded}=useData(), message=useDailyMessage(subject);
  return <section>
    <div className="hello">
      <div><p className="date">{todayLabel(STUDENT.timezone)}</p><h1>Hi {STUDENT.name}!</h1></div>
      <div className="ninja-says">
        <img src="/peaceful-ninja.png" alt="" width="76" height="76"/>
        <p className="bubble">{message}</p>
      </div>
    </div>
    <SubjectTabs subject={subject} onChange={onSubject}/>
    {!loaded?<section className="card checkin-card">
      <div className="section-top"><span className="label">Today’s lesson</span></div>
      <div className="lesson-title"><h2>Loading…</h2></div>
      <p className="muted next-subtitle">Your progress will appear here.</p>
    </section>:subject.type==='course'
      ?<CourseToday key={subject.id} subject={subject} chosenBook={book} onBook={onBook}/>
      :<PracticeToday key={subject.id} subject={subject}/>}
  </section>;
}
