import {pretty} from '../../domain/dates.ts';
import type {CourseEntry,Entry,PracticeEntry} from '../../domain/events.ts';
import type {CourseSubject,PracticeSubject,Subject} from '../../domain/subjects/types.ts';
import {StatusIcon} from '../components/Icons.tsx';
import {SubjectTabs} from '../components/SubjectTabs.tsx';
import {duration} from '../format.ts';
import {bookLabel,bookOf,courseCopy,entriesOf,entryLabel,itemImage,itemOf,kindLabel,practiceCopy,practiceText} from '../subjects.ts';
import {useData,useSongBank} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

function Tools({entry}:{entry:Entry}) {
  const ui=useUi(), when=pretty(entry.date!);
  return <div className="history-tools">
    <button onClick={()=>ui.edit(entry)} aria-label={`Edit check-in from ${when}`}>Edit</button>
    <button onClick={()=>ui.remove(entry.id)} aria-label={`Remove check-in from ${when}`}>Remove</button>
  </div>;
}
function CourseItem({subject,entry}:{subject:CourseSubject;entry:CourseEntry}) {
  return <article className="history-item">
    <span className={`history-symbol ${entry.status}`}><StatusIcon status={entry.status}/></span>
    <div className="history-body">
      <h3>{entry.status==='skipped'?'A day to recharge':`${bookLabel(subject,bookOf(subject,entry))} · Lesson ${entry.lesson} · ${entry.status==='complete'?'Finished!':entry.status==='fixed'?'Fixed mistakes':`${entry.progress*100}% done`}`}</h3>
      <small>{pretty(entry.date,true)}{entry.reason?` · ${entry.reason}`:''}</small>
      {entry.topic&&<p>{entry.topic}</p>}
      {entry.note&&<p>{entry.note}</p>}
    </div>
    <Tools entry={entry}/>
  </article>;
}
function PracticeItem({subject,entry}:{subject:PracticeSubject;entry:PracticeEntry}) {
  const bank=useSongBank(), text=practiceText(entry,bank), feel=entry.feel&&practiceCopy(subject).feel?.[entry.feel];
  return <article className="history-item">
    <img className="history-symbol history-ninja" src={itemImage(subject,itemOf(subject,entry))} alt="" width="46" height="46"/>
    <div className="history-body">
      <h3>{entryLabel(subject,entry)} · {subject.lessons?`${kindLabel(entry)} · `:''}{duration(entry.minutes)}</h3>
      <small>{pretty(entry.date,true)}{feel&&<span className={`feel-pill ${entry.feel}`}>{feel}</span>}</small>
      {text&&<p>{text}</p>}
      {entry.note&&<p>{entry.note}</p>}
    </div>
    <Tools entry={entry}/>
  </article>;
}

export function Journal({subject,onSubject}:{subject:Subject;onSubject(id:string):void}) {
  const {entries,ready,loaded}=useData(), ui=useUi();
  const copy=subject.type==='course'?courseCopy(subject):practiceCopy(subject);
  const list=entriesOf(subject,entries).reverse();
  const add=()=>subject.type==='course'?ui.openCourse(subject):ui.openPractice(subject);
  return <section>
    <div className="page-heading">
      <p className="label">Your effort, remembered</p>
      <h1>Journal</h1>
      <p className="muted">Big wins, tiny steps, and days you needed a breather. They all belong here.</p>
    </div>
    <SubjectTabs subject={subject} onChange={onSubject}/>
    <div className="history-toolbar"><button className="primary" disabled={!ready} onClick={add}>+ Add a check-in</button></div>
    <div>{!loaded?null:list.length?list.map(entry=>subject.type==='course'
      ?<CourseItem key={entry.id} subject={subject} entry={entry as CourseEntry}/>
      :<PracticeItem key={entry.id} subject={subject} entry={entry as PracticeEntry}/>)
      :<div className="empty"><img src="/peaceful-ninja.png" alt="" width="72" height="72"/><h2>{copy.journal.empty[0]}</h2><p>{copy.journal.empty[1]}</p></div>}
    </div>
    <p className="small muted">{copy.journal.note}</p>
  </section>;
}
