import {Fragment,useId,type CSSProperties} from 'react';
import {addDays,pretty,type Day} from '../../domain/dates.ts';
import {MATH,ENGLISH} from '../../domain/student.ts';
import {percentOf,type CourseSummary} from '../../domain/subjects/course.ts';
import type {CourseSubject,PracticeSubject,Subject} from '../../domain/subjects/types.ts';
import {SubjectTabs} from '../components/SubjectTabs.tsx';
import {cx,num,plural,versusTarget} from '../format.ts';
import {STUDENT,bookLabel,courseCopy,itemName,itemOf,practiceCopy,practiceText} from '../subjects.ts';
import {useCourse,useData,usePractice,useSongBank,useToday} from '../state/data.tsx';
import type {CourseCopy} from '../messages/types.ts';
import {PracticePlan} from './PracticePlan.tsx';
import {LeaguePlan,UnitsTable} from './RewardsPlan.tsx';

function Goals({subject,s}:{subject:CourseSubject;s:CourseSummary}) {
  const tagline=courseCopy(subject).plan.taglines;
  return <div className="goals">{subject.books.map((config,i)=>{
    const book=s.books[config.id]!, complete=book.total===book.lessons, previous=subject.books[i-1];
    const confirm=s.backlogBook===config.id?s.backlog.length:0;
    const foot=previous?`Starts ${pretty(book.startsOn,true)}, the next weekday after ${bookLabel(subject,previous.id)}`
      :complete?'Every lesson is finished.'
      :`${num(book.lessons-book.total)} lesson-equivalents to go${confirm?` · includes ${plural(confirm,'lesson')} to confirm`:''}`;
    return <article key={config.id} className={cx('goal',s.active===config.id&&'active-goal')}>
      <div className="goal-top">
        <span className="book-icon">{config.id}</span>
        <div className="goal-title"><h3>{bookLabel(subject,config.id)}</h3><span>{tagline[config.id]}</span></div>
        <span className="goal-badge">{complete?'Complete ✓':s.active===config.id?'In progress':'Up next'}</span>
      </div>
      <div className="progress-label"><strong>{book.finished} / {book.lessons} lessons</strong><span className="muted">{percentOf(book)}%</span></div>
      <div className="bar"><span style={{width:`${book.total/book.lessons*100}%`}}></span></div>
      <div className="goal-dates">
        <div><span>{complete?'Finished on':'Projected finish'}</span><strong>{pretty(book.finish,true)}</strong></div>
        <div><span>Original target</span><strong>{pretty(book.target,true)}</strong></div>
      </div>
      {!complete&&<span className="goal-diff">{versusTarget(book.finish,book.target)}</span>}
      <p className="goal-foot">{foot}</p>
    </article>;
  })}</div>;
}

// Books as bars from today to their projected finish, with targets and milestones marked below.
function Timeline({subject,s,plan}:{subject:CourseSubject;s:CourseSummary;plan:CourseCopy['plan']}) {
  const day=useToday(), [from,to]=plan.range;
  const index=(date:Day)=>(Date.parse(date+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000;
  const at=(date:Day)=>Math.max(0,Math.min(100,index(date)/index(to)*100));
  const months:Day[]=[];
  for(let month=from;month<=to;month=addDays(month,32).slice(0,8)+'01') months.push(month);
  const bars:{cls:string;from:Day;to:Day;label:string}[]=[];
  subject.books.forEach((config,i)=>{
    const book=s.books[config.id]!, earlierLeft=subject.books.slice(0,i).some(b=>s.books[b.id]!.total<b.lessons);
    if(book.total<book.lessons) bars.push({cls:i===0?'m5':'m6',from:earlierLeft?book.startsOn:day,to:book.finish,label:bookLabel(subject,config.id)});
  });
  if(plan.school){
    const end=s.books[subject.books.at(-1)!.id]!.finish;
    if(end<plan.school.date) bars.push({cls:'buffer',from:addDays(end,1),to:plan.school.date,label:'Buffer'});
    bars.push({cls:'school',from:plan.school.date,to,label:plan.school.label});
  }
  // Labels that would overlap the one before drop to a second row.
  const marks=[...subject.books.map(b=>({date:b.target,label:`Target ${pretty(b.target)}`})),...(plan.marks??[])].sort((a,b)=>a.date.localeCompare(b.date));
  let previous=-Infinity;
  const placed=marks.map(mark=>{const left=at(mark.date), low=left-previous<10;previous=low?-Infinity:left;return {...mark,left,top:low?124:102};});
  const pos=(left:number,extra?:CSSProperties):CSSProperties=>({left:`${left}%`,...extra});
  return <div className="timeline">
    {months.map(month=><span key={month} className="tl-month" style={pos(at(month))}>{pretty(month).split(' ')[0]}</span>)}
    <div className="tl-track"></div>
    {bars.map(bar=>{const left=at(bar.from), width=Math.max(0,at(bar.to)-left);
      return width>0&&<div key={bar.cls} className={`tl-seg ${bar.cls}`} style={pos(left,{width:`${width}%`})}>{bar.label}</div>;})}
    <div className="tl-mark now" style={pos(at(day))}></div><span className="tl-label now" style={pos(at(day),{top:'96px'})}>Today</span>
    {placed.map(mark=><Fragment key={mark.label}>
      <div className="tl-mark" style={pos(mark.left)}></div><span className="tl-label" style={pos(mark.left,{top:`${mark.top}px`})}>{mark.label}</span>
    </Fragment>)}
  </div>;
}

function CoursePlan({subject}:{subject:CourseSubject}) {
  const s=useCourse(subject), plan=courseCopy(subject).plan, title=useId();
  return <>
    <Goals subject={subject} s={s}/>
    <section className="card timeline-card" aria-labelledby={title}>
      <div className="section-top"><h2 id={title}>{plan.title}</h2><span className="muted">1 lesson per weekday · no holiday breaks</span></div>
      <div className="timeline-scroll"><Timeline subject={subject} s={s} plan={plan}/></div>
      <p className="muted timeline-note">{plan.note(s)}</p>
    </section>
    <UnitsTable subject={subject} s={s}/>
    {STUDENT.league?.subjects.includes(subject.id)&&<LeaguePlan/>}
    <details className="projection-info card"><summary>{plan.info.summary}</summary>{plan.info.paragraphs.map(p=><p key={p}>{p}</p>)}</details>
  </>;
}

function download(state:object,day:Day) {
  const baseline={date:MATH.start,math5Finished:MATH.books[0]!.baseline,english:{date:ENGLISH.start,level:5,finished:ENGLISH.books[0]!.baseline,lessons:ENGLISH.books[0]!.lessons,target:ENGLISH.books[0]!.target}};
  const blob=new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),baseline,...state},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url;a.download=`${STUDENT.id}-progress-${day}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// For Mom: dates, targets, and forecasts, away from Ninja's screen.
export function Plan({subject,onSubject}:{subject:Subject;onSubject(id:string):void}) {
  const {entries,ready,loaded,revision}=useData(), day=useToday();
  return <section>
    <div className="page-heading">
      <p className="label">For Mom</p>
      {subject.type==='practice'
        ?<><h1>{subject.name}</h1><p className="muted">What {STUDENT.name} did, by month, with a log you can print.</p></>
        :<><h1>The plan</h1><p className="muted">Dates, targets and forecasts live here, away from {STUDENT.name}’s screen.</p></>}
    </div>
    <SubjectTabs subject={subject} onChange={onSubject}/>
    <div className="history-toolbar"><button className="secondary" disabled={!ready} onClick={()=>download({entries,revision},day)}>Download progress</button></div>
    {loaded&&(subject.type==='course'?<CoursePlan key={subject.id} subject={subject}/>:<PracticePlan key={subject.id} subject={subject}/>)}
    <p className="small muted">Anyone with the link can look at this page. Saving a check-in needs the shared login.</p>
  </section>;
}
