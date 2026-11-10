import {useId} from 'react';
import type {PracticeEntry} from '../../domain/events.ts';
import {OTHER,type PracticeSubject} from '../../domain/subjects/types.ts';
import {BadgesCard} from '../components/Badges.tsx';
import {NoteIcon} from '../components/Icons.tsx';
import {MonthCalendar} from '../components/MonthCalendar.tsx';
import {WeekCard} from '../components/WeekCard.tsx';
import {cx} from '../format.ts';
import {choicesOf,entryDetail,entryLabel,itemImage,itemOf,practiceCopy} from '../subjects.ts';
import {useData,usePractice,useSongBank,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// Tap an activity to save it, see the month fill with ninjas, and collect badges. Counts days, never streaks.
export function PracticeToday({subject}:{subject:PracticeSubject}) {
  const {ready,entries}=useData(), day=useToday(), s=usePractice(subject), bank=useSongBank(), ui=useUi(), copy=practiceCopy(subject), title=useId();
  const todays=(s.entries as PracticeEntry[]).filter(entry=>entry.date===day), lesson=copy.lesson;
  return <div className="dashboard-grid">
    <div className="main-column">
      <section className="card checkin-card move-card" aria-labelledby={title}>
        <div className="section-top"><span className="label">{copy.today.label}</span><span className="today-state">{s.loggedToday?copy.today.done:''}</span></div>
        <h2 id={title} className="practice-heading">{copy.today.heading}</h2>
        <p className="muted">{copy.today.intro}</p>
        <div className={cx('sport-tiles',choicesOf(subject).length<4&&'few')} role="group" aria-label={copy.today.heading}>{choicesOf(subject).map(item=>
          <button key={item.id} type="button" className={cx('sport-tile',item.id===OTHER&&'other')} disabled={!ready} onClick={()=>ui.openPractice(subject,{item:item.id})}>
            <img src={itemImage(subject,item.id)} alt="" width="80" height="80"/><span>{item.name}</span>
          </button>)}
        </div>
        {subject.lessons&&lesson&&<button type="button" className="lesson-button" disabled={!ready} onClick={()=>ui.openPractice(subject,{kind:'lesson'})}>
          <span className="action-icon"><NoteIcon/></span><strong>{lesson[0]}</strong><small>{lesson[1]}</small>
        </button>}
        {todays.length>0&&<div className="saved-today">
          <h3 className="label">{copy.today.saved}</h3>
          <div className="music-today">{todays.map(entry=><div key={entry.id} className="music-row">
            <img src={itemImage(subject,itemOf(subject,entry))} alt="" width="52" height="52"/>
            <div>
              <strong>{entryLabel(subject,entry)}{entry.feel&&<span className={`feel-pill ${entry.feel}`}>{copy.feel![entry.feel]}</span>}</strong>
              <span>{entryDetail(subject,entry,bank)}</span>
            </div>
            <button type="button" onClick={()=>ui.edit(entry)} aria-label={`Edit ${entryLabel(subject,entry)}`}>Edit</button>
          </div>)}</div>
        </div>}
      </section>
      <MonthCalendar subject={subject} entries={entries.filter(e=>e.subject===subject.id)} day={day}/>
    </div>
    <aside className="side-column">
      <WeekCard subject={subject} s={s} day={day}/>
      {subject.badges&&<BadgesCard subject={subject} badges={s.badges}/>}
    </aside>
  </div>;
}
