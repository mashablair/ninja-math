import {useId,useState} from 'react';
import type {PracticeEntry} from '../../domain/events.ts';
import type {PracticeSubject} from '../../domain/subjects/types.ts';
import {Calendar,type Picked} from '../components/Calendar.tsx';
import {CheckIcon,NoteIcon} from '../components/Icons.tsx';
import {WeekStrip} from '../components/WeekStrip.tsx';
import {itemName,itemOf,kindLabel,practiceCopy,practiceText} from '../subjects.ts';
import {useData,usePractice,useSongBank,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';
import {MonthToday} from './MonthToday.tsx';

export function MinutesList({subject,minutes}:{subject:PracticeSubject;minutes:Record<string,number>}) {
  return <div className="music-minutes">{subject.items.map(item=><div key={item.id}><span>{item.name}</span><strong>{minutes[item.id]} min</strong></div>)}</div>;
}

export function PracticeToday({subject}:{subject:PracticeSubject}) {
  return subject.layout==='month'?<MonthToday subject={subject}/>:<YearToday subject={subject}/>;
}
function YearToday({subject}:{subject:PracticeSubject}) {
  const {ready}=useData(), day=useToday(), s=usePractice(subject), bank=useSongBank(), ui=useUi(), copy=practiceCopy(subject);
  const ids={today:useId(),calendar:useId()}, [picked,setPicked]=useState<Picked|null>(null);
  const todays=(s.entries as PracticeEntry[]).filter(entry=>entry.date===day);
  const lesson=copy.actions.lesson;
  return <div className="dashboard-grid">
    <div className="main-column">
      <section className="card checkin-card" aria-labelledby={ids.today}>
        <div className="section-top"><span className="label">{copy.today.label}</span></div>
        <h2 id={ids.today} className="practice-heading">{copy.today.heading}</h2>
        <p className="muted">{copy.today.intro}</p>
        <div className="music-today">{todays.length?todays.map(entry=>{
          const text=practiceText(entry,bank);
          return <div key={entry.id} className="music-row">
            <div><strong>{itemName(subject,itemOf(subject,entry))}</strong><span>{subject.lessons?`${kindLabel(entry)} · `:''}{entry.minutes} min</span>{text&&<p>{text}</p>}</div>
            <button type="button" onClick={()=>ui.edit(entry)}>Edit</button>
          </div>;
        }):<p className="muted">{copy.today.empty}</p>}</div>
        <div className={lesson?'checkin-actions two-actions':'checkin-actions one-action'}>
          <button className="action complete" type="button" disabled={!ready} onClick={()=>ui.openPractice(subject,{kind:'practice'})}>
            <span className="action-icon"><CheckIcon/></span><strong>{copy.actions.practice[0]}</strong><small>{copy.actions.practice[1]}</small>
          </button>
          {lesson&&<button className="action partial" type="button" disabled={!ready} onClick={()=>ui.openPractice(subject,{kind:'lesson'})}>
            <span className="action-icon"><NoteIcon/></span><strong>{lesson[0]}</strong><small>{lesson[1]}</small>
          </button>}
        </div>
      </section>
      <section className="card practice-card" aria-labelledby={ids.calendar}>
        <h3 id={ids.calendar}>{copy.calendar.heading}</h3>
        <p className="muted">{copy.calendar.intro}</p>
        <div className="practice-calendars">{subject.items.map(item=>
          <Calendar key={item.id} subject={subject} item={item} day={day} bank={bank} picked={picked} onPick={setPicked}/>)}
        </div>
        <div className="hm-legend" aria-hidden="true">
          <span>Less</span><i className="hm-cell"></i><i className="hm-cell l1"></i><i className="hm-cell l2"></i><i className="hm-cell l3"></i><i className="hm-cell l4"></i><span>More</span>
          {subject.lessons&&<><span className="hm-key"><i className="hm-cell l3"></i>Practice</span><span className="hm-key"><i className="hm-cell l3 hm-lesson"></i>Lesson with teacher</span></>}
        </div>
      </section>
    </div>
    <aside className="side-column">
      <section className="card overall-card">
        <h3>This week</h3>
        <MinutesList subject={subject} minutes={s.minutes}/>
      </section>
      <section className="card week-card">
        <h3>{copy.today.days}</h3>
        <WeekStrip day={day} entries={s.entries} copy={copy.week}/>
      </section>
    </aside>
  </div>;
}
