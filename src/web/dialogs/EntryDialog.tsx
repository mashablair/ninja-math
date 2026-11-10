import {useId,useState,type FormEvent,type ReactNode} from 'react';
import {summarizeCourse} from '../../domain/subjects/course.ts';
import {songsFor} from '../../domain/subjects/practice.ts';
import {CloseButton,Modal} from '../components/Modal.tsx';
import {courseCelebration,practiceCelebration} from '../celebrations.ts';
import {bookLabel,courseCopy,itemOf,practiceCopy} from '../subjects.ts';
import {useCourse,useData,usePractice,useSongBank,useToday} from '../state/data.tsx';
import {useUi,type Editing} from '../state/ui.tsx';
import {SongPicker} from './SongPicker.tsx';

type CourseEditing=Extract<Editing,{type:'course'}>;
type PracticeEditing=Extract<Editing,{type:'practice'}>;

export function EntryDialog({editing,onClose}:{editing:Editing|null;onClose():void}) {
  const title=useId();
  return <Modal open={!!editing} onClose={onClose} labelledBy={title}>
    {editing?.type==='course'&&<CourseForm key={editing.id} editing={editing} titleId={title} onDone={onClose}/>}
    {editing?.type==='practice'&&<PracticeForm key={editing.id} editing={editing} titleId={title} onDone={onClose}/>}
  </Modal>;
}

// Keeps the form open with a message when saving fails, so nothing typed is lost.
function useSave() {
  const {ready,load}=useData(), [error,setError]=useState(''), [saving,setSaving]=useState(false);
  const submit=(work:()=>Promise<void>)=>async(event:FormEvent)=>{
    event.preventDefault();
    if(!ready&&!await load()){setError('Still unable to connect. Your form is saved here; try Save again when you are online.');return;}
    setSaving(true);setError('');
    try{await work();}catch(failure){setError((failure as Error).message);}finally{setSaving(false);}
  };
  return {error,saving,submit};
}
function Shell({title,titleId,context,error,saving,onSubmit,onDone,children}:{title:string;titleId:string;context?:string;error:string;saving:boolean;onSubmit(event:FormEvent):void;onDone():void;children:ReactNode}) {
  return <form onSubmit={onSubmit}>
    <div className="dialog-header"><span className="label">Check-in</span><CloseButton label="Close check-in" onClick={onDone}/></div>
    <h2 id={titleId}>{title}</h2>
    <p className="muted">Let’s save what you worked on.</p>
    {context&&<p className="muted">{context}</p>}
    {children}
    <p className="form-error" role="alert">{error}</p>
    <button type="submit" className="primary save-button" disabled={saving}>Save my check-in</button>
  </form>;
}
const DateField=({start,value,onChange}:{start:string;value:string;onChange(value:string):void})=>{
  const day=useToday();
  return <label>Date<input type="date" required min={start} max={day} value={value} onChange={e=>onChange(e.target.value)}/></label>;
};

function CourseForm({editing,titleId,onDone}:{editing:CourseEditing;titleId:string;onDone():void}) {
  const {subject,existing}=editing, s=useCourse(subject), day=useToday(), {mutate}=useData(), ui=useUi(), {error,saving,submit}=useSave();
  const startBook=existing?Number(existing[subject.bookField]??subject.books[0]!.id):editing.book??s.active;
  const startLesson=existing?.lesson??editing.lesson??s.nextLesson;
  const startProgress=existing?.progress||s.books[startBook]?.progress[startLesson-1]||0.5;
  const [date,setDate]=useState(existing?.date??day), [book,setBook]=useState(startBook), [status,setStatus]=useState(editing.status);
  const [lesson,setLesson]=useState(String(startLesson)), [progress,setProgress]=useState(startProgress===1?'0.5':String(startProgress));
  const [topic,setTopic]=useState(existing?.topic??''), [reason,setReason]=useState(existing?.reason??'');
  const skipped=status==='skipped', single=subject.books.length===1, lessons=s.books[book]?.lessons??120;
  const title=existing?'Make your check-in just right.':editing.status==='skipped'?'Rest is part of learning.':editing.status==='partial'?'Little steps still count.':'Woohoo! Let’s add your sticker.';

  const save=submit(async()=>{
    const n=Number(lesson), copy=courseCopy(subject);
    if(subject.askTopic&&!skipped&&!topic.trim()) throw new Error('Type what the lesson was about.');
    const entry={subject:subject.id,date,[subject.bookField]:book,lesson:skipped?null:n,status,
      progress:status==='complete'?1:status==='partial'?Number(progress):0,...(subject.askTopic?{topic:skipped?'':topic}:{}),reason,note:existing?.note??''};
    const wasDone=status==='complete'&&s.books[book]?.progress[n-1]===1;
    const next=await mutate('save',editing.id,entry);
    onDone();
    const after=summarizeCourse(subject,next.entries,day);
    if(status==='complete'&&!wasDone&&after.books[book]?.progress[n-1]===1){
      ui.earn({subject:subject.id,book,lessons:[n]});
      ui.celebrate(courseCelebration(subject,book,[n],s,after));
    }else ui.toast(status==='complete'?'Saved! Nice work.':status==='partial'?copy.partialMessage():copy.breakMessage());
  });
  return <Shell title={title} titleId={titleId} context={single?bookLabel(subject,subject.books[0]!.id):undefined} error={error} saving={saving} onSubmit={save} onDone={onDone}>
    <div className="form-row">
      <DateField start={subject.start} value={date} onChange={setDate}/>
      {!single&&<label>Book<select value={book} onChange={e=>setBook(Number(e.target.value))}>{subject.books.map(b=><option key={b.id} value={b.id}>{bookLabel(subject,b.id)}</option>)}</select></label>}
    </div>
    <label>How did it go?<select value={status} onChange={e=>setStatus(e.target.value as typeof status)}>
      <option value="complete">Finished a lesson ✓</option><option value="partial">Did part of it</option><option value="skipped">Took a break</option>
    </select></label>
    {!skipped&&<div className="form-row">
      <label>Lesson number<input type="number" min="1" max={lessons} step="1" required value={lesson} onChange={e=>setLesson(e.target.value)}/></label>
      {status==='partial'&&<label>Total finished so far<select value={progress} onChange={e=>setProgress(e.target.value)}>
        <option value="0.25">¼ of the lesson</option><option value="0.5">½ of the lesson</option><option value="0.75">¾ of the lesson</option>
      </select></label>}
    </div>}
    {subject.askTopic&&!skipped&&<label>What was the lesson about?<input maxLength={100} placeholder="e.g. Adding fractions" required value={topic} onChange={e=>setTopic(e.target.value)}/></label>}
    {status==='partial'&&<p className="small muted">Choose the total completed, including earlier work on this lesson.</p>}
    <label>Anything get in the way? <span className="optional">Optional</span><select value={reason} onChange={e=>setReason(e.target.value)}>
      <option value="">No reason needed</option>{['Needed help','Ran out of time','Needed a rest','Other plans','Something else'].map(r=><option key={r}>{r}</option>)}
    </select></label>
  </Shell>;
}

function PracticeForm({editing,titleId,onDone}:{editing:PracticeEditing;titleId:string;onDone():void}) {
  const {subject,existing}=editing, s=usePractice(subject), bank=useSongBank(), day=useToday(), {mutate}=useData(), ui=useUi(), {error,saving,submit}=useSave();
  const copy=practiceCopy(subject);
  const startItem=():string=>{
    if(existing) return itemOf(subject,existing);
    if(copy.form.defaultItem==='last'&&s.entries.length) return itemOf(subject,s.entries.at(-1)!);
    const logged=new Set(s.entries.filter(e=>e.date===day).map(e=>itemOf(subject,e)));
    return (copy.form.defaultItem==='unlogged'&&subject.items.find(item=>!logged.has(item.id))||subject.items[0]!).id;
  };
  const [date,setDate]=useState(existing?.date??day), [item,setItem]=useState(startItem), [kind,setKind]=useState(editing.kind);
  const [minutes,setMinutes]=useState(String(existing?.minutes??copy.form.defaultMinutes)), [focus,setFocus]=useState(existing?.focus??'');
  const [songs,setSongs]=useState(()=>new Set(existing?.songs??[])), [picker,setPicker]=useState(0);
  const teacher=!!subject.lessons&&kind==='lesson';
  const pickItem=(id:string)=>{setItem(id);setSongs(new Set());setPicker(n=>n+1);};

  const save=submit(async()=>{
    const mine=new Set(songsFor(bank,item).map(song=>song.id)), chosen=[...songs].filter(id=>mine.has(id));
    if(subject.songs&&!chosen.length&&!focus.trim()) throw new Error(`Choose a song or write ${subject.labels.focus}.`);
    const length=teacher?subject.lessons!.minutes:Number(minutes);
    const entry={subject:subject.id,date,[subject.itemField]:item,...(subject.lessons?{kind}:{}),minutes:length,...(subject.songs?{songs:chosen}:{}),focus,note:existing?.note??''};
    await mutate('save',editing.id,entry);
    onDone();
    if(existing) ui.toast('Saved!');
    else ui.celebrate(practiceCelebration(subject,item,length,kind));
  });
  return <Shell title={copy.form.title(editing.kind,!!existing)} titleId={titleId} error={error} saving={saving} onSubmit={save} onDone={onDone}>
    <div className="form-row"><DateField start={subject.start} value={date} onChange={setDate}/></div>
    <div>
      <fieldset className="pick-field"><legend>{copy.form.itemLegend}</legend><div className="instrument-cards">
        {subject.items.map(option=><label key={option.id} className="instrument-card">
          <input type="radio" name={subject.itemField} value={option.id} checked={item===option.id} onChange={()=>pickItem(option.id)}/>
          <span><img src={`/ninja-${option.id}.webp`} alt="" width="64" height="64"/>{option.name}</span>
        </label>)}
      </div></fieldset>
      {subject.lessons&&<fieldset className="pick-field"><legend>What kind?</legend><div className="kind-cards">
        <label className="kind-card kind-practice"><input type="radio" name="kind" value="practice" checked={kind==='practice'} onChange={()=>setKind('practice')}/><span><i className="kind-icon" aria-hidden="true">✓</i>Practice</span></label>
        <label className="kind-card kind-teacher"><input type="radio" name="kind" value="lesson" checked={kind==='lesson'} onChange={()=>setKind('lesson')}/><span><i className="kind-icon" aria-hidden="true">♪</i>Lesson with my teacher</span></label>
      </div></fieldset>}
      {!teacher&&<label>Minutes<input type="number" min="1" max={subject.maxMinutes} step="1" inputMode="numeric" required value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>}
      {subject.songs
        ?<fieldset className="pick-field song-field"><legend>What did you work on?</legend>
          <SongPicker key={picker} subject={subject} item={item} chosen={songs} onChosen={setSongs}/>
          <input className="song-focus" maxLength={200} placeholder={copy.form.focus.placeholder} aria-label={copy.form.focus.label} value={focus} onChange={e=>setFocus(e.target.value)}/>
        </fieldset>
        :<label>{copy.form.focus.label} <span className="optional">Optional</span><input maxLength={200} placeholder={copy.form.focus.placeholder} value={focus} onChange={e=>setFocus(e.target.value)}/></label>}
    </div>
  </Shell>;
}
