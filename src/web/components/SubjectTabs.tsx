import type {Subject} from '../../domain/subjects/types.ts';
import {STUDENT} from '../subjects.ts';

export function SubjectTabs({subject,onChange}:{subject:Subject;onChange(id:string):void}) {
  return <div className="subject-tabs" role="group" aria-label="Subject">
    {STUDENT.subjects.map(s=><button key={s.id} type="button" className={s.id===subject.id?'selected':undefined} aria-pressed={s.id===subject.id} onClick={()=>onChange(s.id)}>{s.name}</button>)}
  </div>;
}
