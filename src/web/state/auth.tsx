import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import * as api from '../api.ts';
import {LoginDialog} from '../dialogs/LoginDialog.tsx';

// Viewing is public; saving needs the one shared login. A save that needs it asks, then carries on.
interface Auth {
  authed:boolean;
  // Resolves once logged in; rejects if the login dialog is closed first.
  ensureLogin():Promise<void>;
  requireLogin(action:()=>void):void;
  expired():void;
  logOut():Promise<void>;
}
const AuthContext=createContext<Auth|null>(null);
export const useAuth=()=>useContext(AuthContext)!;

export function AuthProvider({children}:{children:ReactNode}) {
  const [authed,setAuthed]=useState(false), [asking,setAsking]=useState(false);
  const authedRef=useRef(false), pending=useRef<{resolve():void;reject(error:Error):void}|null>(null);
  const mark=(value:boolean)=>{authedRef.current=value;setAuthed(value);};
  useEffect(()=>{void api.fetchSession().then(mark);},[]);

  const ensureLogin=useCallback(()=>authedRef.current?Promise.resolve():new Promise<void>((resolve,reject)=>{
    pending.current={resolve,reject};setAsking(true);
  }),[]);
  const auth=useMemo<Auth>(()=>({
    authed,ensureLogin,
    requireLogin:action=>{ensureLogin().then(action,()=>{});},
    expired:()=>mark(false),
    logOut:async()=>{await api.logOut();mark(false);}
  }),[authed,ensureLogin]);

  function settle(loggedIn:boolean) {
    const job=pending.current;pending.current=null;setAsking(false);
    if(loggedIn){mark(true);job?.resolve();}
    else job?.reject(new Error('Please log in to save this.'));
  }
  return <AuthContext.Provider value={auth}>
    {children}
    <LoginDialog open={asking} onLoggedIn={()=>settle(true)} onClose={()=>{if(pending.current) settle(false);}}/>
  </AuthContext.Provider>;
}
