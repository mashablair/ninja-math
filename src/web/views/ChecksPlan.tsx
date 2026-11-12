import {useId,useState} from 'react';
import {pretty} from '../../domain/dates.ts';
import {checkedId,type CheckedEntry} from '../../domain/events.ts';
import type {CourseSummary,Waiting} from '../../domain/subjects/course.ts';
import type {CourseSubject} from '../../domain/subjects/types.ts';
import {plural} from '../format.ts';
import {STUDENT,bookLabel,lessonTitle} from '../subjects.ts';
import {useAuth} from '../state/auth.tsx';
import {useData,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

const RECENT=5;
// For Mom: finished lessons waiting for her check. Marking one correct gives it a green ✓ on Ninja's path;
// a belt needs a ✓ on every lesson in its unit. Undo removes the check.
export function ChecksPlan({subject,s}:{subject:CourseSubject;s:CourseSummary}) {
  const {entries,ready,mutate}=useData(), {requireLogin}=useAuth(), ui=useUi(), day=useToday(), title=useId(), [busy,setBusy]=useState(false);
  const many=subject.books.length>1, name=(book:number,lesson:number)=>{
    const t=lessonTitle(subject,book,lesson);
    return `${many?`${bookLabel(subject,book)} · `:''}Lesson ${lesson}${t?` · ${t}`:''}`;
  };
  const recent=(entries.filter(e=>e.subject==='checked'&&e.of===subject.id) as CheckedEntry[]).sort((a,b)=>b.seq-a.seq).slice(0,RECENT);
  const run=(work:()=>Promise<string>)=>requireLogin(async()=>{
    setBusy(true);
    try{ui.toast(await work());}catch(failure){ui.toast((failure as Error).message);}
    finally{setBusy(false);}
  });
  const check=(list:Waiting[])=>run(async()=>{
    for(const w of list) await mutate('save',checkedId(subject.id,w.book,w.lesson),{subject:'checked',of:subject.id,book:w.book,lesson:w.lesson,date:day});
    return `${list.length===1?`Lesson ${list[0]!.lesson} is`:`${plural(list.length,'lesson')} are`} checked. ${STUDENT.name} will see a green ✓.`;
  });
  const undo=(entry:CheckedEntry)=>run(async()=>{
    await mutate('remove',entry.id);
    return `Lesson ${entry.lesson} is waiting for your check again.`;
  });
  return <section className="card checks-card" aria-labelledby={title}>
    <div className="section-top"><h2 id={title}>Waiting for your check</h2>{s.waiting.length>1&&<button type="button" className="secondary" disabled={!ready||busy} onClick={()=>check(s.waiting)}>Mark all {s.waiting.length} correct</button>}</div>
    <p className="muted">When every answer is right, mark the lesson correct. {STUDENT.name} sees a green ✓ on it, and a unit’s belt needs a ✓ on every lesson. Days she spends fixing mistakes show here too.</p>
    {s.waiting.length
      ?<ul className="check-list">{s.waiting.map(w=><li key={`${w.book}-${w.lesson}`}>
        <div><strong>{name(w.book,w.lesson)}</strong>
          <small>{w.finishedOn?`Finished ${pretty(w.finishedOn)}`:'Finished'}{w.fixedOn.length?` · Fixed mistakes ${w.fixedOn.map(d=>pretty(d)).join(', ')}`:''}</small></div>
        <button type="button" className="primary" disabled={!ready||busy} onClick={()=>check([w])} aria-label={`Mark ${name(w.book,w.lesson)} all correct`}>✓ All correct</button>
      </li>)}</ul>
      :<p className="checks-empty">Nothing waiting. Every finished lesson has its ✓.</p>}
    {recent.length>0&&<details className="checks-recent"><summary>Recently checked</summary><ul className="check-list">{recent.map(e=><li key={e.id}>
      <div><strong>{name(e.book,e.lesson)}</strong><small>Checked {pretty(e.date)}</small></div>
      <button type="button" className="link-button" disabled={!ready||busy} onClick={()=>undo(e)} aria-label={`Undo the check on ${name(e.book,e.lesson)}`}>Undo</button>
    </li>)}</ul></details>}
  </section>;
}
