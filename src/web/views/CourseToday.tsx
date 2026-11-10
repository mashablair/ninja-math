import {useEffect,useId} from 'react';
import {percentOf} from '../../domain/subjects/course.ts';
import type {CourseEntry} from '../../domain/events.ts';
import type {CourseSubject} from '../../domain/subjects/types.ts';
import {BeltCard} from '../components/BeltCard.tsx';
import {CheckIcon,PartIcon,RestIcon} from '../components/Icons.tsx';
import {LeagueCard} from '../components/LeagueCard.tsx';
import {LessonPath,lessonState} from '../components/LessonPath.tsx';
import {WeekStrip} from '../components/WeekStrip.tsx';
import {cx,plural} from '../format.ts';
import {beltName,league as leagueCopy,leagueName} from '../messages/rewards.ts';
import {bookLabel,bookOf,courseCopy,entriesOf,lessonTitle} from '../subjects.ts';
import {useCourse,useData,useLeague,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// Lessons in a set: one run of numbers reads "69–74".
function lessonList(lessons:number[]) {
  if(lessons.length===1) return `Lesson ${lessons[0]}`;
  const first=lessons[0]!, last=lessons.at(-1)!;
  return last-first===lessons.length-1?`Lessons ${lessons[0]}–${lessons.at(-1)}`:`Lessons ${lessons.join(', ')}`;
}

// Moving up a league gets its own celebration the first time she opens Math or English that week, once per device.
function usePromotion() {
  const league=useLeague(), ui=useUi(), last=league?.last;
  useEffect(()=>{
    if(!league||last?.result!=='up') return;
    const key=`league-seen-${last.monday}`;
    try{if(localStorage.getItem(key)) return;localStorage.setItem(key,'1');}catch{return;}
    const {title,message}=leagueCopy.promoted(leagueName(league.league));
    ui.celebrate({sticker:'↑',title,message,mascot:'/unicorn.svg',sound:'math',big:true,badge:{league:league.league,name:leagueName(league.league),detail:'Moved up!',more:0}});
  },[league,last,ui]);
}

// Every sticker in the book, for looking back. With units it sits folded under the path.
function StickerGrid({subject,s,book,onLesson}:{subject:CourseSubject;s:ReturnType<typeof useCourse>;book:number;onLesson(n:number):void}) {
  const ui=useUi(), confirming=subject.books.some(b=>b.needsConfirmation?.length);
  return <>
    <div className="lesson-map">{s.books[book]!.progress.map((_,i)=>{
      const n=i+1, {state,label}=lessonState(subject,s,book,n), name=lessonTitle(subject,book,n);
      const earned=ui.earned?.subject===subject.id&&ui.earned.book===book&&ui.earned.lessons.includes(n);
      return <button key={n} className={cx('lesson',state,earned&&'just-earned')} title={`Lesson ${n}${name?` · ${name}`:''}: ${label}`} aria-label={`${bookLabel(subject,book)}, lesson ${n}, ${label}`} onClick={()=>onLesson(n)}>{n}</button>;
    })}</div>
    <div className="legend">
      <span><i className="done"></i>Finished</span>
      <span><i className="part"></i>Part done</span>
      <span><i className="today"></i>Today</span>
      {confirming&&<span><i className="check"></i>Check these</span>}
      <span><i></i>Coming up</span>
    </div>
  </>;
}

// The collection shows the book in progress until another one is picked.
export function CourseToday({subject,chosenBook,onBook}:{subject:CourseSubject;chosenBook:number|undefined;onBook(book:number):void}) {
  const {entries,ready}=useData(), day=useToday(), s=useCourse(subject), league=useLeague(), ui=useUi(), copy=courseCopy(subject);
  const ids={next:useId(),map:useId()}, book=chosenBook??s.active;
  usePromotion();
  const allDone=subject.books.every(b=>s.books[b.id]!.total===b.lessons);
  const active=s.books[s.active]!, shown=s.books[book]!;
  const started=!allDone&&active.progress[s.nextLesson-1]!>0;
  const pct=percentOf(active), mine=entriesOf(subject,entries) as CourseEntry[];
  const path=s.units.some(u=>u.book===book), unit=s.unit, name=allDone?'':lessonTitle(subject,s.active,s.nextLesson);
  const kind=!unit||allDone?'':unit.test.includes(s.nextLesson)?'test':unit.review===s.nextLesson?'review':'';
  const tapLesson=(n:number)=>{
    if(!ready) return;
    const progress=shown.progress[n-1]!;
    const existing=mine.findLast(e=>bookOf(subject,e)===book&&e.lesson===n&&e.date===day)??null;
    ui.openCourse(subject,{status:progress>0&&progress<1?'partial':'complete',book,lesson:n,existing});
  };
  const subtitle=allDone?copy.allDone.subtitle:started?'Pick up where you left off. You’ve already started this one.':s.loggedToday?'You checked in today. Want to do more? You can check in again.':'Your next lesson is ready when you are.';
  return <div className="dashboard-grid">
    <div className="main-column">
      <section className="card checkin-card" aria-labelledby={ids.next}>
        <div className="section-top"><span className="label">Today’s lesson{unit&&!allDone?` · Unit ${unit.number}`:''}</span><span className="today-state">{s.loggedToday?'Checked in today ✓':''}</span></div>
        <div className="lesson-title"><h2 id={ids.next}>{allDone?'You did it!':`Lesson ${s.nextLesson}`}</h2><span className="lesson-book">{allDone?copy.allDone.book:bookLabel(subject,s.active)}</span></div>
        {name&&<p className="lesson-name">{name}</p>}
        {kind&&<p className={cx('lesson-kind',kind)}>{kind==='test'?`Belt test! The assessment finishes your ${beltName(unit!.belt).toLowerCase()}.`:'Unit review: a fun one before the assessment.'}</p>}
        <p className="muted next-subtitle">{subtitle}</p>
        <div className="checkin-actions">
          <button className="action complete" disabled={!ready} onClick={()=>ui.openCourse(subject,{status:'complete'})}>
            <span className="action-icon"><CheckIcon/></span><strong>I finished it!</strong><small>Add a sticker</small>
          </button>
          <button className="action partial" disabled={!ready} onClick={()=>ui.openCourse(subject,{status:'partial'})}>
            <span className="action-icon"><PartIcon/></span><strong>I did part of it</strong><small>Pick up later</small>
          </button>
          <button className="action skip" disabled={!ready} onClick={()=>ui.openCourse(subject,{status:'skipped'})}>
            <span className="action-icon"><RestIcon/></span><strong>Taking a break</strong><small>Rest counts too</small>
          </button>
        </div>
      </section>

      <section className="card map-card" aria-labelledby={ids.map}>
        <div className="section-top">
          <div>
            <h2 id={ids.map}>{path?`My ${bookLabel(subject,book)} path`:`My ${bookLabel(subject,book)} collection`}</h2>
            <p className="muted">{book>s.active?`${bookLabel(subject,book)} starts after ${bookLabel(subject,s.active)}. You’re getting there!`:`${plural(shown.finished,'sticker')} so far. Tap a lesson to update it.`}</p>
          </div>
          {subject.books.length>1&&<div className="book-tabs" role="group" aria-label="Lesson book">
            {subject.books.map(b=><button key={b.id} className={b.id===book?'selected':undefined} aria-pressed={b.id===book} onClick={()=>onBook(b.id)}>{bookLabel(subject,b.id)}</button>)}
          </div>}
        </div>
        {path
          ?<><LessonPath subject={subject} s={s} book={book} onLesson={tapLesson}/>
            <details className="sticker-details"><summary>My sticker collection · {plural(shown.finished,'sticker')}</summary><StickerGrid subject={subject} s={s} book={book} onLesson={tapLesson}/></details></>
          :<StickerGrid subject={subject} s={s} book={book} onLesson={tapLesson}/>}
      </section>
    </div>

    <aside className="side-column">
      {league&&<LeagueCard s={league} day={day}/>}
      {unit&&!allDone?<BeltCard subject={subject} s={s}/>:<section className="card overall-card">
        <div className="ring-wrap">
          <svg viewBox="0 0 180 180" aria-hidden="true"><circle className="ring-bg" cx="90" cy="90" r="74"/><circle className="ring-fill" cx="90" cy="90" r="74" style={{strokeDashoffset:String(465*(1-active.total/active.lessons))}}/></svg>
          <div className="ring-label"><strong>{pct}%</strong><span>of {bookLabel(subject,s.active)}</span></div>
        </div>
        <p className="ring-count">{active.finished} of {active.lessons} lessons</p>
        <p className="muted book-cheer">{copy.bookCheer(pct)}</p>
      </section>}

      {s.backlog.length>0&&<section className="card catchup-card">
        <span className="label">Quick check</span>
        <h3>{lessonList(s.backlog)}</h3>
        <p>Did you finish {s.backlog.length===1?'this one':'any of these'}? Check them off so they become stickers.</p>
        <button className="dark-button" disabled={!ready} onClick={()=>ui.catchUp(subject)}>Check them off</button>
      </section>}

      <section className="card week-card">
        <h3>This week</h3>
        <WeekStrip day={day} entries={mine} copy={copy.week}/>
      </section>
    </aside>
  </div>;
}
