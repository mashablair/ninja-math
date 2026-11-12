import {useMemo} from 'react';
import type {Subject} from '../../domain/subjects/types.ts';
import {SubjectTabs} from '../components/SubjectTabs.tsx';
import {cx,todayLabel} from '../format.ts';
import {nudgeFor} from '../../domain/nudge.ts';
import {summarizeCourse} from '../../domain/subjects/course.ts';
import {ANGRY_NINJAS,sassyMessage} from '../messages/sassy.ts';
import {leagueName} from '../messages/rewards.ts';
import {sassyVoice} from '../tweaks.ts';
import {STUDENT,courseCopy,entriesOf,practiceCopy,subjectById} from '../subjects.ts';
import {useData,useLeague,useToday} from '../state/data.tsx';
import {CourseToday} from './CourseToday.tsx';
import {PracticeToday} from './PracticeToday.tsx';

// Slipping on Math or English gets a sassy line (unless she picked gentle in Tweaks); otherwise the day's kind one.
function useDailyMessage(subject:Subject):{text:string;sassy:boolean} {
  const {entries,loaded}=useData(), day=useToday(), league=useLeague();
  if(!loaded) return {text:'Small steps add up to big things.',sassy:false};
  if(subject.type==='course'&&sassyVoice()){
    const nudge=nudgeFor(STUDENT,subject,entries,league,day);
    if(nudge) return {text:sassyMessage(nudge.kind==='lopsided'?{...nudge,other:subjectById(nudge.other)?.name??nudge.other}:nudge,
      {subject:subject.name,lesson:summarizeCourse(subject,entries,day).nextLesson,league:leagueName(league!.league),day}),sassy:true};
  }
  // A fix-up is real work, but today's lesson is still waiting.
  const todays=entriesOf(subject,entries).filter(entry=>entry.date===day&&entry.status!=='fixed');
  const copy=subject.type==='course'?courseCopy(subject):practiceCopy(subject);
  return {text:copy.dailyMessage(day,{loggedToday:todays.length>0,lastStatus:todays.at(-1)?.status as string|undefined}),sassy:false};
}

// Ninja's screen. No dates, targets, or forecasts here; those live in the plan.
export function Today({subject,onSubject,book,onBook}:{subject:Subject;onSubject(id:string):void;book:number|undefined;onBook(book:number):void}) {
  const {loaded}=useData(), message=useDailyMessage(subject);
  // Picked once per subject visit, so he doesn't change faces while she reads.
  const angry=useMemo(()=>ANGRY_NINJAS[Math.floor(Math.random()*ANGRY_NINJAS.length)]!,[subject.id]);
  return <section>
    <div className="hello">
      <div><p className="date">{todayLabel(STUDENT.timezone)}</p><h1>Hi {STUDENT.name}!</h1></div>
      <div className="ninja-says">
        {message.sassy
          ?<img key={angry} className="angry-ninja" src={angry} alt="" width="76" height="76"/>
          :<img src="/peaceful-ninja.png" alt="" width="76" height="76"/>}
        <p className={cx('bubble',message.sassy&&'sassy')}>{message.text}</p>
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
