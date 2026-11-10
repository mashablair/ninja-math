import {useId,useMemo,useState} from 'react';
import {addMonths,monthOf,type Day} from '../../domain/dates.ts';
import {monthCalendar,type MonthDay} from '../../domain/calendar.ts';
import type {Entry,PracticeEntry} from '../../domain/events.ts';
import {totals} from '../../domain/subjects/practice.ts';
import type {PracticeSubject} from '../../domain/subjects/types.ts';
import {cx,duration,longDay,monthName,plural} from '../format.ts';
import {choicesOf,entryLabel,itemImage,itemNoun,itemOf,practiceCopy} from '../subjects.ts';

const WEEKDAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const line=(subject:PracticeSubject,entry:PracticeEntry)=>[`${entryLabel(subject,entry)} · ${duration(entry.minutes)}`,entry.focus].filter(Boolean).join(' · ');

// One month at a time, with that day's ninja on each day she moved. Arrows go back to when the subject started.
export function MonthCalendar({subject,entries,day}:{subject:PracticeSubject;entries:readonly Entry[];day:Day}) {
  const copy=practiceCopy(subject), title=useId();
  const [month,setMonth]=useState(monthOf(day)), [only,setOnly]=useState<string|null>(null), [picked,setPicked]=useState<Day|null>(null);
  const logs=useMemo(()=>only?entries.filter(e=>itemOf(subject,e)===only):entries,[entries,only,subject]);
  const weeks=useMemo(()=>monthCalendar(logs,month,day),[logs,month,day]);
  const sum=totals(subject,logs,month+'-01',month+'-31');
  const chosen=weeks.flat().find(cell=>cell?.date===picked);
  const go=(n:number)=>{setMonth(addMonths(month,n));setPicked(null);};
  const label=(cell:MonthDay)=>`${longDay(cell.date)}: ${cell.entries.length?cell.entries.map(e=>`${entryLabel(subject,e as PracticeEntry)} ${duration(Number(e.minutes))}`).join(', '):'nothing saved'}`;
  return <section className="card month-card" aria-labelledby={title}>
    <div className="section-top">
      <div>
        <h2 id={title} aria-live="polite">{monthName(month)}</h2>
        <p className="muted">{sum.days?`${plural(sum.days,'day')} of moving · ${duration(sum.minutes)} · ${plural(sum.activities.length,`different ${itemNoun(subject)}`)}`:copy.month!.empty(monthName(month,false))}</p>
      </div>
      <div className="month-arrows">
        <button type="button" aria-label="Previous month" disabled={month<=monthOf(subject.start)} onClick={()=>go(-1)}>‹</button>
        <button type="button" aria-label="Next month" disabled={month>=monthOf(day)} onClick={()=>go(1)}>›</button>
      </div>
    </div>
    <div className="filter-chips" role="group" aria-label={`Show ${subject.labels.items}`}>
      <button type="button" aria-pressed={only===null} onClick={()=>{setOnly(null);setPicked(null);}}>All</button>
      {choicesOf(subject).map(item=><button key={item.id} type="button" aria-pressed={only===item.id} onClick={()=>{setOnly(item.id);setPicked(null);}}>
        <img src={itemImage(subject,item.id)} alt="" width="28" height="28"/>{item.name}
      </button>)}
    </div>
    <div className="month-grid">
      {WEEKDAYS.map(d=><span key={d} className="month-weekday" aria-hidden="true">{d}</span>)}
      {weeks.flat().map((cell,i)=>{
        if(!cell) return <span key={`blank-${i}`} className="month-day blank"/>;
        const n=Number(cell.date.slice(8));
        if(cell.future) return <span key={cell.date} className="month-day future" aria-hidden="true"><i>{n}</i></span>;
        const items=[...new Set(cell.entries.map(e=>itemOf(subject,e)))];
        return <button key={cell.date} type="button" className={cx('month-day',items.length>0&&'moved',cell.date===day&&'current',picked===cell.date&&'selected')}
          aria-label={label(cell)} aria-pressed={picked===cell.date} onClick={()=>setPicked(picked===cell.date?null:cell.date)}>
          <i>{n}</i>
          {items.length>0&&<span className={cx('month-ninjas',items.length>1&&'many')}>{items.slice(0,2).map(item=><img key={item} src={itemImage(subject,item)} alt="" width="48" height="48"/>)}</span>}
        </button>;
      })}
    </div>
    <p className="hm-detail" aria-live="polite" hidden={!chosen}>
      {chosen&&<><strong>{longDay(chosen.date)}</strong>{chosen.entries.length
        ?chosen.entries.map(entry=><span key={entry.id}>{line(subject,entry as PracticeEntry)}</span>)
        :<span>{copy.month!.nothing(longDay(chosen.date))}</span>}</>}
    </p>
    {!chosen&&<p className="muted month-hint">{copy.month!.intro}</p>}
  </section>;
}
