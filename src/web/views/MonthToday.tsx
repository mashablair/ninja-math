import {useId} from 'react';
import type {PracticeEntry} from '../../domain/events.ts';
import {OTHER,type PracticeSubject} from '../../domain/subjects/types.ts';
import {BadgesCard} from '../components/Badges.tsx';
import {MonthCalendar} from '../components/MonthCalendar.tsx';
import {WeekCard} from '../components/WeekCard.tsx';
import {cx,duration} from '../format.ts';
import {choicesOf,entryLabel,itemImage,itemOf,practiceCopy} from '../subjects.ts';
import {useData,usePractice,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// Tap a sport to save it, see the month fill with ninjas, and collect badges. Counts days, never streaks.
export function MonthToday({subject}:{subject:PracticeSubject}) {
  const {ready,entries}=useData(), day=useToday(), s=usePractice(subject), ui=useUi(), copy=practiceCopy(subject), title=useId();
  const todays=(s.entries as PracticeEntry[]).filter(entry=>entry.date===day);
  return <div className="dashboard-grid">
    <div className="main-column">
      <section className="card checkin-card move-card" aria-labelledby={title}>
        <div className="section-top"><span className="label">{copy.today.label}</span><span className="today-state">{s.loggedToday?copy.today.done:''}</span></div>
        <h2 id={title} className="practice-heading">{copy.today.heading}</h2>
        <p className="muted">{copy.today.intro}</p>
        <div className="sport-tiles" role="group" aria-label={copy.today.heading}>{choicesOf(subject).map(item=>
          <button key={item.id} type="button" className={cx('sport-tile',item.id===OTHER&&'other')} disabled={!ready} onClick={()=>ui.openPractice(subject,{item:item.id})}>
            <img src={itemImage(subject,item.id)} alt="" width="80" height="80"/><span>{item.name}</span>
          </button>)}
        </div>
        {todays.length>0&&<div className="saved-today">
          <h3 className="label">{copy.today.saved}</h3>
          <div className="music-today">{todays.map(entry=><div key={entry.id} className="music-row">
            <img src={itemImage(subject,itemOf(subject,entry))} alt="" width="52" height="52"/>
            <div>
              <strong>{entryLabel(subject,entry)}{entry.feel&&<span className={`feel-pill ${entry.feel}`}>{copy.feel![entry.feel]}</span>}</strong>
              <span>{[duration(entry.minutes),entry.focus].filter(Boolean).join(' · ')}</span>
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
