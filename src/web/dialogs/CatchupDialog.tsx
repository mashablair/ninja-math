import {useState} from 'react';
import {summarizeCourse} from '../../domain/subjects/course.ts';
import type {CourseSubject} from '../../domain/subjects/types.ts';
import {CloseButton,Modal} from '../components/Modal.tsx';
import {courseCelebration} from '../celebrations.ts';
import {useCourse,useData,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// Lessons that may be done but were never confirmed. Only a logged confirmation finishes them.
export function CatchupDialog({subject,onClose}:{subject:CourseSubject|null;onClose():void}) {
  return <Modal open={!!subject} onClose={onClose}>
    {subject&&<Catchup subject={subject} onClose={onClose}/>}
  </Modal>;
}
function Catchup({subject,onClose}:{subject:CourseSubject;onClose():void}) {
  const before=useCourse(subject), day=useToday(), {mutate}=useData(), ui=useUi();
  const [lessons]=useState(before.backlog), book=before.backlogBook!;
  const [checked,setChecked]=useState<Set<number>>(new Set()), [saved,setSaved]=useState<number[]>([]), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const toggle=(n:number,on:boolean)=>setChecked(prev=>{const next=new Set(prev);if(on)next.add(n);else next.delete(n);return next;});
  async function save() {
    const picked=lessons.filter(n=>checked.has(n));
    if(!picked.length){setError('Select at least one finished lesson.');return;}
    setBusy(true);setError('');
    const done:number[]=[];
    try{
      let state;
      for(const lesson of picked){
        state=await mutate('save',crypto.randomUUID(),{subject:subject.id,date:day,[subject.bookField]:book,lesson,status:'complete',progress:1,reason:'',note:''});
        done.push(lesson);setSaved([...saved,...done]);toggle(lesson,false);
      }
      onClose();
      ui.earn({subject:subject.id,book,lessons:done});
      ui.celebrate(courseCelebration(subject,book,done,before,summarizeCourse(subject,state!.entries,day)));
    }catch(failure){setError(`${(failure as Error).message} Any already-saved lessons are unchecked.`);}
    finally{setBusy(false);}
  }
  return <>
    <div className="dialog-header"><span className="label">Quick check</span><CloseButton label="Close quick check" onClick={onClose}/></div>
    <h2>Which ones did you finish?</h2>
    <p className="muted">Select the lessons you fully finished. For part-done lessons, tap the lesson in your collection instead.</p>
    <div className="catchup-options">{lessons.map(n=><label key={n}>Lesson {n}
      <input type="checkbox" value={n} aria-label={`Lesson ${n} fully finished`} checked={checked.has(n)} disabled={saved.includes(n)} onChange={e=>toggle(n,e.target.checked)}/>
    </label>)}</div>
    <p className="form-error" role="alert">{error}</p>
    <button className="primary save-button" disabled={busy} onClick={save}>Add these stickers</button>
  </>;
}
