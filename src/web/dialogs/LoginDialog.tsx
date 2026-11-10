import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
import * as api from '../api.ts';
import {CloseButton,Modal} from '../components/Modal.tsx';

export function LoginDialog({open,onLoggedIn,onClose}:{open:boolean;onLoggedIn():void;onClose():void}) {
  const title=useId(), user=useRef<HTMLInputElement>(null);
  const [username,setUsername]=useState(''), [password,setPassword]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  useEffect(()=>{if(open){setError('');user.current?.focus();}},[open]);
  async function submit(event:FormEvent) {
    event.preventDefault();setBusy(true);setError('');
    try{await api.logIn(username,password);setPassword('');onLoggedIn();}
    catch(failure){setError((failure as Error).message);}
    finally{setBusy(false);}
  }
  return <Modal open={open} onClose={onClose} labelledBy={title}><form onSubmit={submit}>
    <div className="dialog-header"><span className="label">Save a check-in</span><CloseButton label="Close login" onClick={onClose}/></div>
    <h2 id={title}>Log in to save</h2>
    <p className="muted">You can look through the days and lessons. Logging in lets this device save a check-in.</p>
    <label>Username<input ref={user} name="username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)}/></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <p className="form-error" role="alert">{error}</p>
    <button type="submit" className="primary save-button" disabled={busy}>Log in</button>
  </form></Modal>;
}
