import {createContext,useCallback,useContext,useMemo,useRef,useState,type ReactNode} from 'react';
import type {CourseEntry,Entry,PracticeEntry,Status} from '../../domain/events.ts';
import type {CourseSubject,PracticeSubject} from '../../domain/subjects/types.ts';
import {play} from '../sounds.ts';
import {bookOf,subjectById} from '../subjects.ts';
import {useAuth} from './auth.tsx';
import {EntryDialog} from '../dialogs/EntryDialog.tsx';
import {RemoveDialog} from '../dialogs/RemoveDialog.tsx';
import {CatchupDialog} from '../dialogs/CatchupDialog.tsx';
import {GoalDialog} from '../dialogs/GoalDialog.tsx';
import {CelebrationDialog} from '../components/Celebration.tsx';
import {Toast} from '../components/Toast.tsx';

export interface Celebration {
  sticker:string|number;title:string;message:string;label?:string;percent?:number;count?:string;mascot:string;sound:string;big?:boolean;
  // A word under the sticker's number ("min"), the progress row's own text instead of a percent, and a badge just earned.
  unit?:string;value?:string;badge?:NewBadge;
  // A mascot photo sits in a circle; the unicorn flies as it is.
  round?:boolean;
}
export interface NewBadge {image?:string;text?:string;name:string;detail:string;more:number}
export type Editing=
  |{type:'course';subject:CourseSubject;id:string;existing:CourseEntry|null;status:Status;book?:number;lesson?:number}
  |{type:'practice';subject:PracticeSubject;id:string;existing:PracticeEntry|null;kind:'practice'|'lesson';item?:string};
// Stickers that were just earned pop in the collection.
export interface Earned {subject:string;book:number;lessons:number[]}

interface Ui {
  toast(message:string):void;
  celebrate(celebration:Celebration):void;
  earned:Earned|null;
  earn(earned:Earned):void;
  // Each of these asks for the login first when needed.
  openCourse(subject:CourseSubject,options?:{status?:Status;book?:number;lesson?:number;existing?:CourseEntry|null}):void;
  openPractice(subject:PracticeSubject,options?:{kind?:'practice'|'lesson';item?:string;existing?:PracticeEntry|null}):void;
  setGoal(subject:PracticeSubject):void;
  edit(entry:Entry):void;
  remove(entryId:string):void;
  catchUp(subject:CourseSubject):void;
}
const UiContext=createContext<Ui|null>(null);
export const useUi=()=>useContext(UiContext)!;

export function UiProvider({children}:{children:ReactNode}) {
  const {requireLogin}=useAuth();
  const [message,setMessage]=useState(''), toastTimer=useRef(0);
  const [celebration,setCelebration]=useState<Celebration&{key:number}|null>(null), [celebrating,setCelebrating]=useState(false);
  const [earned,setEarned]=useState<Earned|null>(null), earnTimer=useRef(0);
  const [editing,setEditing]=useState<Editing|null>(null);
  const [removing,setRemoving]=useState<string|null>(null);
  const [catchup,setCatchup]=useState<CourseSubject|null>(null);
  const [goal,setGoal]=useState<PracticeSubject|null>(null);

  const toast=useCallback((text:string)=>{
    setMessage(text);clearTimeout(toastTimer.current);
    toastTimer.current=window.setTimeout(()=>setMessage(''),4500);
  },[]);
  const celebrate=useCallback((next:Celebration)=>{
    play(next.sound,{big:next.big});
    setCelebration({...next,key:Date.now()});setCelebrating(true);
  },[]);
  const earn=useCallback((next:Earned)=>{
    setEarned(next);clearTimeout(earnTimer.current);
    earnTimer.current=window.setTimeout(()=>setEarned(null),1200);
  },[]);
  const ui=useMemo<Ui>(()=>{
    const openCourse:Ui['openCourse']=(subject,{status,book,lesson,existing=null}={})=>requireLogin(()=>setEditing({
      type:'course',subject,id:existing?.id??crypto.randomUUID(),existing,status:existing?.status??status??'complete',book,lesson
    }));
    const openPractice:Ui['openPractice']=(subject,{kind='practice',item,existing=null}={})=>requireLogin(()=>setEditing({
      type:'practice',subject,id:existing?.id??crypto.randomUUID(),existing,kind:existing?.kind??kind,item
    }));
    return {
      toast,celebrate,earned,earn,openCourse,openPractice,
      edit(entry){
        const subject=subjectById(entry.subject);
        if(subject?.type==='course'){const course=entry as CourseEntry;openCourse(subject,{book:bookOf(subject,entry),lesson:course.lesson??undefined,existing:course});}
        else if(subject) openPractice(subject,{existing:entry as PracticeEntry});
      },
      remove:entryId=>requireLogin(()=>setRemoving(entryId)),
      catchUp:subject=>requireLogin(()=>setCatchup(subject)),
      setGoal:subject=>requireLogin(()=>setGoal(subject))
    };
  },[toast,celebrate,earned,earn,requireLogin]);

  return <UiContext.Provider value={ui}>
    {children}
    <EntryDialog editing={editing} onClose={()=>setEditing(null)}/>
    <RemoveDialog entryId={removing} onClose={()=>setRemoving(null)}/>
    <CatchupDialog subject={catchup} onClose={()=>setCatchup(null)}/>
    <GoalDialog subject={goal} onClose={()=>setGoal(null)}/>
    <CelebrationDialog celebration={celebration} open={celebrating} onClose={()=>setCelebrating(false)}/>
    <Toast message={message}/>
  </UiContext.Provider>;
}
