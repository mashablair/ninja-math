import {useEffect,useState} from 'react';
import {TweaksIcon} from './components/Icons.tsx';
import {TweaksDialog} from './dialogs/TweaksDialog.tsx';
import {cx} from './format.ts';
import {unlock} from './sounds.ts';
import {STUDENT,subjectById} from './subjects.ts';
import {syncThemeColor} from './tweaks.ts';
import {AuthProvider} from './state/auth.tsx';
import {DataProvider,useData,type Sync} from './state/data.tsx';
import {UiProvider} from './state/ui.tsx';
import {Today} from './views/Today.tsx';
import {Journal} from './views/Journal.tsx';
import {Plan} from './views/Plan.tsx';

type View='today'|'journal'|'plan';
const VIEWS:[View,string][]=[['today','Today'],['journal','Journal'],['plan','For Mom']];
const SYNC:Record<Sync,string>={
  connecting:'Connecting to your progress…',syncing:'Syncing your progress…',synced:'✓ Progress synced',
  error:'Could not sync. Check your connection, then tap Refresh progress.'
};
function savedSubject() {
  try{return subjectById(localStorage.getItem('ninja-subject'))??STUDENT.subjects[0]!;}
  catch{return STUDENT.subjects[0]!;}
}

function Shell() {
  const {sync,load}=useData();
  const [view,setView]=useState<View>('today'), [subject,setSubject]=useState(savedSubject), [tweaks,setTweaks]=useState(false);
  const [books,setBooks]=useState<Record<string,number>>({});
  const pickSubject=(id:string)=>{
    const next=subjectById(id);if(!next) return;
    setSubject(next);
    try{localStorage.setItem('ninja-subject',next.id);}catch{}
  };
  const pickView=(next:View)=>{setView(next);window.scrollTo({top:0});};
  useEffect(()=>{
    syncThemeColor();
    const scheme=matchMedia('(prefers-color-scheme: dark)');scheme.addEventListener('change',syncThemeColor);
    const events=['pointerdown','keydown'] as const;
    events.forEach(type=>document.addEventListener(type,unlock,{capture:true,passive:true}));
    return ()=>{scheme.removeEventListener('change',syncThemeColor);events.forEach(type=>document.removeEventListener(type,unlock,{capture:true}));};
  },[]);
  return <>
    <header className="topbar">
      <div className="topbar-inner">
        <a href="#" className="brand" aria-label={`${STUDENT.name} · home`}><img src="/peaceful-ninja.png" alt="" width="44" height="44"/><span><strong>{STUDENT.name}</strong><small>My journey</small></span></a>
        <nav aria-label="Main navigation">{VIEWS.map(([id,label])=>
          <button key={id} className={cx('nav',view===id&&'active')} aria-current={view===id?'page':undefined} onClick={()=>pickView(id)}>{label}</button>)}
        </nav>
        <button className="tweaks-button" aria-haspopup="dialog" aria-label="Tweaks" onClick={()=>setTweaks(true)}><TweaksIcon/><span>Tweaks</span></button>
      </div>
    </header>
    <main>
      <div className={cx('connection',sync==='error'&&'error')} role="status">{SYNC[sync]}</div>
      {view==='today'&&<Today subject={subject} onSubject={pickSubject} book={books[subject.id]} onBook={book=>setBooks({...books,[subject.id]:book})}/>}
      {view==='journal'&&<Journal subject={subject} onSubject={pickSubject}/>}
      {view==='plan'&&<Plan subject={subject} onSubject={pickSubject}/>}
      <footer><span>Made for {STUDENT.name}, one lesson at a time. ♡</span><span>Check-ins are public · keep them non-personal <button onClick={()=>void load()}>↻ Refresh progress</button></span></footer>
    </main>
    <TweaksDialog open={tweaks} onClose={()=>setTweaks(false)} subject={subject}/>
  </>;
}

export function App() {
  return <AuthProvider><DataProvider><UiProvider><Shell/></UiProvider></DataProvider></AuthProvider>;
}
