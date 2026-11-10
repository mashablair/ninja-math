import {useId,useState} from 'react';
import {goalId} from '../../domain/subjects/practice.ts';
import type {PracticeSubject} from '../../domain/subjects/types.ts';
import {CloseButton,Modal} from '../components/Modal.tsx';
import {plural} from '../format.ts';
import {practiceCopy} from '../subjects.ts';
import {useData,usePractice} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// Her own goal, in days a week. Saving again replaces it; "No goal" removes it.
export function GoalDialog({subject,onClose}:{subject:PracticeSubject|null;onClose():void}) {
  const title=useId();
  return <Modal open={!!subject} onClose={onClose} labelledBy={title}>
    {subject&&<GoalForm subject={subject} titleId={title} onClose={onClose}/>}
  </Modal>;
}
function GoalForm({subject,titleId,onClose}:{subject:PracticeSubject;titleId:string;onClose():void}) {
  const {mutate}=useData(), ui=useUi(), s=usePractice(subject), copy=practiceCopy(subject).goal!;
  const [days,setDays]=useState(s.goal??3), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  async function run(work:()=>Promise<unknown>,message:string) {
    setBusy(true);setError('');
    try{await work();onClose();ui.toast(message);}
    catch(failure){setError((failure as Error).message);}
    finally{setBusy(false);}
  }
  const save=()=>run(()=>mutate('save',goalId(subject),{subject:'goal',of:subject.id,days}),`Goal saved: ${plural(days,'day')} a week.`);
  const clear=()=>run(()=>mutate('remove',goalId(subject)),'No goal for now. Moving still counts!');
  return <>
    <div className="dialog-header"><span className="label">{subject.name}</span><CloseButton label="Close goal" onClick={onClose}/></div>
    <h2 id={titleId}>{copy.title}</h2>
    <p className="muted">{copy.hint}</p>
    <fieldset className="pick-field"><legend>{copy.question}</legend><div className="minute-chips goal-chips">
      {[1,2,3,4,5,6,7].map(n=><label key={n} className="chip">
        <input type="radio" name="goal-days" value={n} aria-label={plural(n,'day')} checked={days===n} onChange={()=>setDays(n)}/><span>{n}</span>
      </label>)}
    </div></fieldset>
    <p className="form-error" role="alert">{error}</p>
    <button type="button" className="primary save-button" disabled={busy} onClick={save}>Save my goal</button>
    {s.goal!=null&&<button type="button" className="link-button goal-clear" disabled={busy} onClick={clear}>No goal for now</button>}
  </>;
}
