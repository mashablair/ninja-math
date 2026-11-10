import {useState} from 'react';
import {songsFor} from '../../domain/subjects/practice.ts';
import type {PracticeSubject} from '../../domain/subjects/types.ts';
import {itemName} from '../subjects.ts';
import {useData,useSongBank} from '../state/data.tsx';

// Songs are saved as soon as they're added or archived, so the bank is shared across logs.
// Archiving hides a song from new logs but keeps its name on old ones.
export function SongPicker({subject,item,chosen,onChosen}:{subject:PracticeSubject;item:string;chosen:Set<string>;onChosen(songs:Set<string>):void}) {
  const {mutate}=useData(), bank=useSongBank();
  const [editing,setEditing]=useState(false), [adding,setAdding]=useState(false), [title,setTitle]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState<string|null>(null);
  const songs=songsFor(bank,item);
  const shown=songs.filter(song=>!song.archived||chosen.has(song.id)), archived=songs.filter(song=>song.archived&&!chosen.has(song.id));
  const choose=(id:string,on:boolean)=>{const next=new Set(chosen);if(on)next.add(id);else next.delete(id);onChosen(next);};
  const closeAdd=()=>{setAdding(false);setTitle('');setError('');};

  async function save(id:string,song:{title:string;archived:boolean},button:string) {
    setError('');setBusy(button);
    try{await mutate('save',id,{subject:'song',[subject.itemField]:item,...song});return true;}
    catch(failure){setError((failure as Error).message);return false;}
    finally{setBusy(null);}
  }
  async function add() {
    const name=title.trim();
    if(!name){setError('Type the song name first.');return;}
    const same=songs.find(song=>song.title.localeCompare(name,'en',{sensitivity:'base'})===0);
    if(same&&!same.archived){choose(same.id,true);closeAdd();return;}
    const id=same?.id??`song-${crypto.randomUUID()}`;
    if(await save(id,{title:same?.title??name,archived:false},'add')){choose(id,true);closeAdd();}
  }
  async function archive(id:string,archived:boolean) {
    const song=bank.find(s=>s.id===id);if(!song) return;
    if(await save(id,{title:song.title,archived},id)&&archived) choose(id,false);
  }
  return <>
    <div className="song-chips">
      {!shown.length&&<p className="muted song-empty">No {itemName(subject,item).toLowerCase()} songs yet.</p>}
      {shown.map(song=>editing
        ?<span key={song.id} className="song-chip editing"><span>{song.title}</span><button type="button" aria-label={`Archive ${song.title}`} disabled={busy===song.id} onClick={()=>archive(song.id,true)}>Archive</button></span>
        :<label key={song.id} className="song-chip"><input type="checkbox" value={song.id} checked={chosen.has(song.id)} onChange={e=>choose(song.id,e.target.checked)}/><span>{song.title}</span></label>)}
      {!editing&&<button type="button" className="song-chip add" onClick={()=>{setAdding(true);setError('');}}>+ Add a song</button>}
    </div>
    {adding&&<div className="song-add">
      <input className="song-title" maxLength={subject.songs!.maxTitle} placeholder="Song name" aria-label="New song name" autoFocus value={title} onChange={e=>setTitle(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void add();}}}/>
      <button type="button" className="secondary" disabled={busy==='add'} onClick={()=>void add()}>Add</button>
      <button type="button" className="link-button" onClick={closeAdd}>Cancel</button>
    </div>}
    <p className="song-tools"><button type="button" className="link-button" aria-pressed={editing} hidden={!songs.length} onClick={()=>{setEditing(!editing);closeAdd();}}>{editing?'Done':'Edit songs'}</button></p>
    {editing&&archived.length>0&&<div className="song-archived">
      <span className="small muted">Archived</span>
      {archived.map(song=><span key={song.id} className="song-chip editing archived"><span>{song.title}</span><button type="button" aria-label={`Bring back ${song.title}`} disabled={busy===song.id} onClick={()=>archive(song.id,false)}>Bring back</button></span>)}
    </div>}
    <p className="form-error" role="alert">{error}</p>
  </>;
}
