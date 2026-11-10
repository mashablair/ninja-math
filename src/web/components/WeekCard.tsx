import {useId} from 'react';
import type {Day} from '../../domain/dates.ts';
import type {PracticeSummary} from '../../domain/subjects/practice.ts';
import type {PracticeSubject} from '../../domain/subjects/types.ts';
import {duration,plural} from '../format.ts';
import {itemImage,itemName,practiceCopy} from '../subjects.ts';
import {useData} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';
import {WeekStrip} from './WeekStrip.tsx';

// The week as days she moved, her goal if she set one, and only the activities she did. No zeros.
export function WeekCard({subject,s,day}:{subject:PracticeSubject;s:PracticeSummary;day:Day}) {
  const {ready}=useData(), ui=useUi(), copy=practiceCopy(subject), title=useId(), goal=s.goal, days=s.week.days;
  return <section className="card week-card this-week" aria-labelledby={title}>
    <h3 id={title}>This week</h3>
    <WeekStrip day={day} entries={s.entries} copy={copy.week} quiet/>
    {subject.goal&&(goal!=null
      ?<div className="goal-box">
        <div className="goal-head"><strong>My goal: {plural(goal,'day')}</strong><button type="button" className="link-button" disabled={!ready} onClick={()=>ui.setGoal(subject)}>Change</button></div>
        <div className="goal-steps" role="img" aria-label={`${Math.min(days,goal)} of ${goal} days`}>{Array.from({length:goal},(_,i)=><i key={i} className={i<days?'done':undefined}/>)}</div>
        <p>{days>=goal?copy.goal!.reached:copy.goal!.progress(days,goal)}</p>
      </div>
      :<div className="goal-box none">
        <p>{copy.goal!.none}</p>
        <button type="button" className="secondary" disabled={!ready} onClick={()=>ui.setGoal(subject)}>{copy.goal!.set}</button>
      </div>)}
    {s.week.activities.length
      ?<ul className="week-activities">{s.week.activities.map(a=><li key={a.name??a.item}>
        <img src={itemImage(subject,a.item)} alt="" width="40" height="40"/><strong>{a.name||itemName(subject,a.item)}</strong><span>{duration(a.minutes)}</span>
      </li>)}</ul>
      :<p className="muted week-empty">{copy.thisWeek!.empty}</p>}
  </section>;
}
