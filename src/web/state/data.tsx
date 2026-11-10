import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {today} from '../../domain/dates.ts';
import type {Entry} from '../../domain/events.ts';
import {summarizeCourse} from '../../domain/subjects/course.ts';
import {summarizePractice,songBank} from '../../domain/subjects/practice.ts';
import type {CourseSubject,PracticeSubject} from '../../domain/subjects/types.ts';
import * as api from '../api.ts';
import {STUDENT,SONG_SUBJECT} from '../subjects.ts';
import {useAuth} from './auth.tsx';

export type Sync='connecting'|'syncing'|'synced'|'error';
interface Data {
  entries:Entry[];
  revision:number;
  // At least one load has arrived, so summaries reflect real progress.
  loaded:boolean;
  // The last load succeeded; saving is allowed.
  ready:boolean;
  sync:Sync;
  load():Promise<api.JourneyState|null>;
  // Saves or removes, then reloads. Resolves with the fresh state.
  mutate(operation:api.Operation,entryId:string,entry?:object):Promise<api.JourneyState>;
}
const DataContext=createContext<Data|null>(null);
const EMPTY:Entry[]=[];
export const useData=()=>useContext(DataContext)!;

export function DataProvider({children}:{children:ReactNode}) {
  const {ensureLogin,expired}=useAuth();
  const [state,setState]=useState<api.JourneyState|null>(null), [ready,setReady]=useState(false), [sync,setSync]=useState<Sync>('connecting');
  const revision=useRef(0);

  const load=useCallback(async()=>{
    setSync('syncing');
    try{
      const next=await api.fetchState();
      revision.current=next.revision;setState(next);setReady(true);setSync('synced');
      return next;
    }catch{setReady(false);setSync('error');return null;}
  },[]);
  const mutate=useCallback(async(operation:api.Operation,entryId:string,entry?:object)=>{
    for(;;){
      try{await api.postEntry(operation,entryId,entry,revision.current);break;}
      catch(error){
        if(error instanceof api.LoginRequired){expired();await ensureLogin();continue;}
        if(error instanceof api.Conflict){await load();throw new Error('Newer progress has been loaded. Your form is still here. Review it and save again.');}
        throw error;
      }
    }
    const next=await load();
    if(!next) throw new Error('Your check-in was saved, but the refreshed view could not load. Please refresh before making another change.');
    return next;
  },[load,ensureLogin,expired]);

  useEffect(()=>{
    void load();
    const quiet=()=>!document.querySelector('dialog[open]');
    const online=()=>{if(quiet()) void load();};
    const visible=()=>{if(document.visibilityState==='visible'&&quiet()) void load();};
    window.addEventListener('online',online);document.addEventListener('visibilitychange',visible);
    return ()=>{window.removeEventListener('online',online);document.removeEventListener('visibilitychange',visible);};
  },[load]);

  const value=useMemo<Data>(()=>({entries:state?.entries??EMPTY,revision:state?.revision??0,loaded:!!state,ready,sync,load,mutate}),[state,ready,sync,load,mutate]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useToday=()=>today(new Date(),STUDENT.timezone);
export function useCourse(subject:CourseSubject) {
  const {entries}=useData(), day=useToday();
  return useMemo(()=>summarizeCourse(subject,entries,day),[subject,entries,day]);
}
export function usePractice(subject:PracticeSubject) {
  const {entries}=useData(), day=useToday();
  return useMemo(()=>summarizePractice(subject,entries,day),[subject,entries,day]);
}
export function useSongBank() {
  const {entries}=useData();
  return useMemo(()=>SONG_SUBJECT?songBank(SONG_SUBJECT,entries):[],[entries]);
}
