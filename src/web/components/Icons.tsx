import type {Status} from '../../domain/events.ts';

const svg={viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true} as const;
export const CheckIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
export const PartIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="3" strokeLinejoin={undefined}><path d="M12 4a8 8 0 1 0 8 8h-8z"/></svg>;
export const RestIcon=({size}:{size?:number})=><svg {...svg} width={size} height={size} strokeWidth="2.6"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>;
export const NoteIcon=()=><svg {...svg} strokeWidth="2.6" strokeLinejoin={undefined}><path d="M9 18a3 3 0 1 1-2-2.83V6l10-2v9.17A3 3 0 1 1 15 16V8L9 9.2V18z"/></svg>;
export const TweaksIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/></svg>;
export function StatusIcon({status}:{status:Status}) {
  if(status==='complete') return <CheckIcon size={22}/>;
  if(status==='partial') return <PartIcon size={22}/>;
  return <RestIcon size={22}/>;
}
