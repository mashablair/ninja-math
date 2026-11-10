import {useId,useState} from 'react';
import {addMonths,monthOf} from '../../domain/dates.ts';
import type {PracticeEntry} from '../../domain/events.ts';
import {earnedBadges,firstMonth,totals} from '../../domain/subjects/practice.ts';
import {OTHER,type PracticeSubject} from '../../domain/subjects/types.ts';
import {duration,monthName,plural,shortDay} from '../format.ts';
import {STUDENT,choicesOf,entryLabel,itemName,itemNoun,kindLabel,practiceCopy,practiceText} from '../subjects.ts';
import {usePractice,useSongBank,useToday} from '../state/data.tsx';

const dash=(minutes:number)=>minutes?duration(minutes):'–';

// For Mom: the week, her goal, totals by month, and a log that prints on its own.
export function PracticePlan({subject}:{subject:PracticeSubject}) {
  const s=usePractice(subject), bank=useSongBank(), day=useToday(), copy=practiceCopy(subject), ids={months:useId(),log:useId(),pick:useId()};
  const months:string[]=[];
  for(let m=monthOf(day);m>=firstMonth(subject,s.entries);m=addMonths(m,-1)) months.push(m);
  const [month,setMonth]=useState(months[0]!);
  const sumOf=(m:string)=>totals(subject,s.entries,m+'-01',m+'-31');
  const now=sumOf(monthOf(day)), week=s.week, goal=s.goal;
  const minutesFor=(sum:ReturnType<typeof sumOf>,item:string)=>sum.activities.filter(a=>a.item===item).reduce((n,a)=>n+a.minutes,0);
  const log=(s.entries as PracticeEntry[]).filter(e=>monthOf(e.date)===month), logSum=sumOf(month);
  const lessonsIn=(m:string)=>s.lessons.filter(e=>monthOf(e.date!)===m).length;
  const names=(list:typeof week.activities)=>list.map(a=>a.name||itemName(subject,a.item)).join(', ');
  return <>
    <div className="stat-cards">
      <article className="card stat-card"><span>This week</span>
        <strong>{week.days?`${plural(week.days,'day')} · ${duration(week.minutes)}`:'Nothing yet'}</strong>
        <p>{week.days?names(week.activities):'The week starts on Monday.'}</p>
      </article>
      {subject.goal&&<article className="card stat-card"><span>{STUDENT.name}’s goal</span>
        <strong>{goal!=null?`${plural(goal,'day')} a week`:'No goal set'}</strong>
        <p>{goal!=null?`She set it herself. ${Math.min(week.days,goal)} of ${goal} so far.`:`She can set one on her ${subject.name} screen if she wants.`}</p>
      </article>}
      <article className="card stat-card"><span>{monthName(monthOf(day),false)} so far</span>
        <strong>{now.days?`${plural(now.days,'day')} · ${duration(now.minutes)}`:'Nothing yet'}</strong>
        <p>{plural(now.activities.length,`different ${itemNoun(subject)}`)}{subject.badges?` · ${plural(earnedBadges(s.badges).length,'badge')}`:''}</p>
      </article>
    </div>
    <section className="card table-card" aria-labelledby={ids.months}>
      <h2 id={ids.months}>Month by month</h2>
      <div className="table-scroll"><table>
        <thead><tr><th>Month</th><th>Days</th>{choicesOf(subject).map(item=><th key={item.id}>{item.name}</th>)}{subject.lessons&&<th>Lessons</th>}<th>Total</th></tr></thead>
        <tbody>{months.map(m=>{const sum=sumOf(m);return <tr key={m}>
          <th scope="row">{monthName(m)}</th><td>{sum.days||'–'}</td>
          {choicesOf(subject).map(item=><td key={item.id}>{dash(minutesFor(sum,item.id))}</td>)}
          {subject.lessons&&<td>{lessonsIn(m)||'–'}</td>}
          <td><strong>{dash(sum.minutes)}</strong></td>
        </tr>;})}</tbody>
      </table></div>
      <p className="goal-foot">A new row starts each month. Days counts any day with at least one {itemNoun(subject)}.{subject.lessons?` Teacher lessons count as ${subject.lessons.minutes} minutes.`:''}</p>
    </section>
    <section className="card table-card print-log" aria-labelledby={ids.log}>
      <div className="section-top">
        <h2 id={ids.log}><span className="print-only">{STUDENT.name} · </span>Activity log · {monthName(month)}</h2>
        <div className="log-tools no-print">
          <label htmlFor={ids.pick}>Month</label>
          <select id={ids.pick} value={month} onChange={e=>setMonth(e.target.value)}>{months.map(m=><option key={m} value={m}>{monthName(m)}</option>)}</select>
          <button type="button" className="secondary" onClick={()=>window.print()}>Print</button>
        </div>
      </div>
      {log.length?<div className="table-scroll"><table>
        <thead><tr><th>Date</th><th>Activity</th><th>Time</th>{subject.feel&&<th>Felt</th>}<th>Notes</th></tr></thead>
        <tbody>{log.map(entry=><tr key={entry.id}>
          <td>{shortDay(entry.date)}</td>
          <td>{entryLabel(subject,entry)}{entry[subject.itemField]===OTHER?<span className="muted"> ({itemName(subject,OTHER).toLowerCase()})</span>:null}{subject.lessons&&entry.kind==='lesson'?<span className="muted"> · {kindLabel(entry).toLowerCase()}</span>:null}</td>
          <td>{duration(entry.minutes)}</td>
          {subject.feel&&<td>{entry.feel?copy.feel![entry.feel]:'–'}</td>}
          <td className="note-cell">{practiceText(entry,bank)}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">Total</th><td>{plural(logSum.days,'day')}</td><td>{duration(logSum.minutes)}</td><td colSpan={subject.feel?2:1}></td></tr></tfoot>
      </table></div>:<p className="muted">Nothing logged in {monthName(month,false)}.</p>}
      <p className="goal-foot no-print">Print gives you just this table on a clean page, handy for a school record or portfolio.</p>
    </section>
  </>;
}
