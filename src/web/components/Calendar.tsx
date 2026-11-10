import {useLayoutEffect,useMemo,useRef} from 'react';
import type {Day} from '../../domain/dates.ts';
import type {PracticeEntry} from '../../domain/events.ts';
import type {CalendarDay} from '../../domain/calendar.ts';
import {practiceCalendar,type BankSong} from '../../domain/subjects/practice.ts';
import type {Item,PracticeSubject} from '../../domain/subjects/types.ts';
import {cx,longDay,monthLabel,plural} from '../format.ts';
import {itemImage,kindLabel,practiceText} from '../subjects.ts';
import {useData} from '../state/data.tsx';

export interface Picked {item:string;date:Day}
function dayLabel(cell:CalendarDay,name:string) {
  if(!cell.entries.length) return `${longDay(cell.date)}: no ${name.toLowerCase()} saved`;
  return `${longDay(cell.date)}: ${cell.minutes} min of ${name.toLowerCase()}${cell.lesson?', with a lesson':''}`;
}

// A year of days for one instrument or activity, newest week on the right.
export function Calendar({subject,item,day,bank,picked,onPick}:{subject:PracticeSubject;item:Item;day:Day;bank:readonly BankSong[];picked:Picked|null;onPick(picked:Picked):void}) {
  const {entries}=useData(), scroll=useRef<HTMLDivElement>(null);
  const calendar=useMemo(()=>practiceCalendar(subject,entries,item.id,day),[subject,entries,item.id,day]);
  useLayoutEffect(()=>{const el=scroll.current!;el.scrollLeft=el.scrollWidth;},[calendar]);
  const chosen=picked?.item===item.id?calendar.weeks.flat().find(cell=>cell.date===picked.date):undefined;
  const line=(entry:PracticeEntry)=>{
    const text=practiceText(entry,bank);
    return `${subject.lessons?`${kindLabel(entry)} · `:''}${entry.minutes} min${text?` · ${text}`:''}`;
  };
  return <div className="practice-instrument">
    <div className="practice-top">
      <div className="practice-name"><img src={itemImage(subject,item.id)} alt="" width="56" height="56"/><strong>{item.name}</strong></div>
      <span className="muted">{calendar.days?`${plural(calendar.days,'day')} of ${item.name.toLowerCase()} in the last year`:`Your ${item.name.toLowerCase()} days will show up here.`}</span>
    </div>
    <div className="heatmap">
      <div className="hm-days" aria-hidden="true">{['','Mon','','Wed','','Fri',''].map((d,i)=><span key={i}>{d}</span>)}</div>
      <div className="hm-scroll" ref={scroll}>
        <div className="hm-months" aria-hidden="true">{calendar.months.map((month,i)=><span key={i}>{month?monthLabel(month):''}</span>)}</div>
        <div className="hm-grid">{calendar.weeks.flat().map(cell=>cell.future
          ?<span key={cell.date} className="hm-cell future"/>
          :<button key={cell.date} type="button" className={cx('hm-cell',`l${cell.level}`,cell.lesson&&'hm-lesson',cell.date===day&&'current',chosen===cell&&'selected')} aria-label={dayLabel(cell,item.name)} onClick={()=>onPick({item:item.id,date:cell.date})}/>)}
        </div>
      </div>
    </div>
    <p className="hm-detail" aria-live="polite" hidden={!chosen}>
      {chosen&&<><strong>{longDay(chosen.date)}</strong>{chosen.entries.length
        ?chosen.entries.map(entry=><span key={entry.id}>{line(entry as PracticeEntry)}</span>)
        :<span>No {item.name.toLowerCase()} saved for this day.</span>}</>}
    </p>
  </div>;
}
