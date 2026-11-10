import {useEffect,useId,useMemo,useRef,useState,type CSSProperties} from 'react';
import {calmEffects} from '../tweaks.ts';
import {cx,plural} from '../format.ts';
import {BadgeMedal} from './Badges.tsx';
import type {Celebration} from '../state/ui.tsx';
import {Modal} from './Modal.tsx';

// Full-screen celebration: sticker pop, flying mascot with a rainbow trail, and confetti.
// Tweaks › Celebrations › Calm and the device's reduced-motion setting turn the motion off.
const COLORS=['#f08a9b','#f6c453','#7fd1a8','#7bb8f0','#b79cf0','#ffffff'];
function confetti() {
  if(calmEffects()) return [];
  return Array.from({length:90},(_,i)=>{
    const round=i%4===0, size=6+Math.random()*8;
    const style={'--x':Math.random()*100+'vw','--w':size+'px','--h':(round?size:size*1.5)+'px','--c':COLORS[i%COLORS.length],
      '--d':(2.4+Math.random()*2)+'s','--delay':(Math.random()*1.2)+'s','--drift':(Math.random()*160-80)+'px','--spin':(Math.random()*720-360)+'deg'} as CSSProperties;
    return <i key={i} className={round?'round':undefined} style={style}/>;
  });
}

export function CelebrationDialog({celebration,open,onClose}:{celebration:(Celebration&{key:number})|null;open:boolean;onClose():void}) {
  const title=useId(), close=useRef<HTMLButtonElement>(null), [bar,setBar]=useState(0);
  const pieces=useMemo(()=>open?confetti():[],[open,celebration?.key]);
  useEffect(()=>{
    if(!open||!celebration) return;
    close.current?.focus();
    setBar(0);
    let frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>setBar(celebration.percent??0));});
    return ()=>cancelAnimationFrame(frame);
  },[open,celebration]);
  const c=celebration;
  return <Modal open={open} onClose={onClose} className="celebration" labelledBy={title}>
    <div className="confetti" aria-hidden="true">{pieces}</div>
    <div className={cx('unicorn-flight',c?.round&&'round')} aria-hidden="true" key={c?.key}><span className="rainbow"></span><img src={c?.mascot??'/unicorn.svg'} alt="" width="220" height="165"/></div>
    <div className="celebration-card">
      <div className="big-sticker">{c?.sticker}{c?.unit&&<small>{c.unit}</small>}</div>
      <h2 id={title}>{c?.title}</h2>
      <p>{c?.message}</p>
      {c?.badge&&<div className="new-badge">
        <BadgeMedal look={c.badge} earned/>
        <div><span className="label">New badge!</span><strong>{c.badge.name}</strong><span>{c.badge.detail}{c.badge.more?` · and ${plural(c.badge.more,'more badge')}`:''}</span></div>
      </div>}
      <div className="celebrate-progress" hidden={c?.label==null}>
        <div className="celebrate-row"><span>{c?.label}</span><span>{c?.value??`${c?.percent}%`}</span></div>
        <div className="celebrate-bar"><span style={{width:`${bar}%`}}></span></div>
        <p className="muted">{c?.count}</p>
      </div>
      <button type="button" className="primary celebrate-close" ref={close} onClick={onClose}>Yay!</button>
    </div>
  </Modal>;
}
