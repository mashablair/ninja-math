import type {Status} from '../../domain/events.ts';
import {useId} from 'react';
import type {Feel} from '../../domain/subjects/types.ts';

const svg={viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true} as const;
export const CheckIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
export const PartIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="3" strokeLinejoin={undefined}><path d="M12 4a8 8 0 1 0 8 8h-8z"/></svg>;
export const RestIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="2.6"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>;
export const FixIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="2.6"><path d="M4 20l1.2-4.6L15.6 5a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z"/><path d="M13.5 7l3.5 3.5"/></svg>;
export const NoteIcon=()=><svg {...svg} strokeWidth="2.6" strokeLinejoin={undefined}><path d="M9 18a3 3 0 1 1-2-2.83V6l10-2v9.17A3 3 0 1 1 15 16V8L9 9.2V18z"/></svg>;
export const TweaksIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/></svg>;
export function StatusIcon({status}:{status:Status}) {
  if(status==='complete') return <CheckIcon size={22}/>;
  if(status==='partial') return <PartIcon size={22}/>;
  if(status==='fixed') return <FixIcon size={22}/>;
  return <RestIcon size={22}/>;
}
// Three faces for how moving felt: a tired sweat drop, a smile, starry eyes.
const FACE:Record<Feel,string>={tough:'#f6b08a',good:'#8fd6b0',amazing:'#f6c453'};
export function FeelIcon({feel}:{feel:Feel}) {
  return <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18" fill={FACE[feel]}/>
    <g fill="none" stroke="#2b2540" strokeWidth="2.4" strokeLinecap="round">
      {feel==='tough'&&<><path d="M13 17h4M23 17h4M14 27h12"/><path d="M31 8c-2 3-2 5 0 6s2-3 0-6z" fill="#7bb8f0" stroke="none"/></>}
      {feel==='good'&&<><path d="M14 16v2M26 16v2"/><path d="M13 24q7 6 14 0"/></>}
      {feel==='amazing'&&<path d="M12 24q8 8 16 0z" fill="#2b2540"/>}
    </g>
    {feel==='amazing'&&<g fill="#2b2540"><path d="M15 12l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z"/><path d="M25 12l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z"/></g>}
  </svg>;
}
// A karate belt tied in a knot, in the belt's color (set by its class in style.css).
export function BeltIcon({belt,size=48}:{belt:number;size?:number}) {
  return <svg className={`belt-icon belt-${belt}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <g fill="currentColor" stroke="var(--belt-line)" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M3 17h42v9H3z"/>
      <path d="M21 25l-9 16 6 2 7-14zM27 25l9 16-6 2-7-14z"/>
      <rect x="18" y="14" width="12" height="15" rx="3"/>
    </g>
  </svg>;
}
// A league shield; the top two leagues shine in rainbow colors.
export function LeagueShield({league,size=64}:{league:number;size?:number}) {
  const id=useId();
  return <svg className={`league-shield tier-${league}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6a6c1"/><stop offset=".5" stopColor="#c9b6f2"/><stop offset="1" stopColor="#8ad3f0"/></linearGradient></defs>
    <path d="M32 4l24 8v18c0 15-10 25-24 30C18 55 8 45 8 30V12z" fill={league>=7?`url(#${id})`:'var(--tier)'} stroke="var(--tier-line)" strokeWidth="3"/>
    <path d="M32 18l4.2 8.6 9.4 1.4-6.8 6.6 1.6 9.4L32 39.6 23.6 44l1.6-9.4-6.8-6.6 9.4-1.4z" fill="#fff" opacity=".9"/>
  </svg>;
}
