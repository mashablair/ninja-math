import {addDays,mondayOf,pretty,type Day} from '../../domain/dates.ts';
import type {Entry} from '../../domain/events.ts';
import {cx,plural} from '../format.ts';

// Monday to Sunday: a check for a day with work, a moon for a day of rest, otherwise just the date.
export function WeekStrip({day,entries,copy}:{day:Day;entries:readonly Entry[];copy:{done:string;noun:string;empty:string}}) {
  const monday=mondayOf(day);
  const days=Array.from({length:7},(_,i)=>{
    const date=addDays(monday,i), logs=entries.filter(entry=>entry.date===date);
    const work=logs.some(entry=>entry.status!=='skipped'), rest=logs.length>0&&!work;
    return {date,work,rest};
  });
  const worked=days.filter(d=>d.work).length;
  return <>
    <div className="week-strip">
      {days.map(({date,work,rest},i)=><div key={date} className={cx('day',work?'logged':rest&&'rest',date===day&&'current')} title={`${pretty(date)}: ${work?copy.done:rest?'Break':'Not logged'}`}>
        {'MTWTFSS'[i]}<span>{work?'✓':rest?'☾':Number(date.slice(8))}</span>
      </div>)}
    </div>
    <p className="muted">{worked?`${plural(worked,'day')} of ${copy.noun} this week. Nice work!`:copy.empty}</p>
  </>;
}
