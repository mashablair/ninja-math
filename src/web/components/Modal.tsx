import {useEffect,useLayoutEffect,useRef,type ReactNode} from 'react';

// A native modal <dialog>: the browser handles focus, Escape, and the backdrop.
export function Modal({open,onClose,className,labelledBy,children}:{open:boolean;onClose():void;className?:string;labelledBy?:string;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null), close=useRef(onClose);
  close.current=onClose;
  useLayoutEffect(()=>{
    const dialog=ref.current!;
    if(open&&!dialog.open) dialog.showModal();
    else if(!open&&dialog.open) dialog.close();
  },[open]);
  useEffect(()=>{
    const dialog=ref.current!, closed=()=>close.current();
    dialog.addEventListener('close',closed);
    return ()=>dialog.removeEventListener('close',closed);
  },[]);
  return <dialog ref={ref} className={className} aria-labelledby={labelledBy}>{children}</dialog>;
}
export const CloseButton=({label,onClick}:{label:string;onClick():void})=>
  <button type="button" className="close" aria-label={label} onClick={onClick}>×</button>;
