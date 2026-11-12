import type {Feel} from './subjects/types.ts';
// D1 keeps an append-only log of events. The current check-ins are derived by replaying it.
export type Operation='save'|'remove';
export interface StoredEvent {seq:number;entry_id:string;operation:Operation;payload:string;request_id?:string;created_at?:string}
export interface Entry {id:string;seq:number;subject:string;date?:string;[field:string]:unknown}
// The shapes validate.ts saves, as readers see them. Older entries may lack the optional fields.
// 'fixed' is a day spent fixing mistakes on a finished lesson; it never changes the lesson's progress.
export type Status='complete'|'partial'|'skipped'|'fixed';
export interface CourseEntry extends Entry {date:string;status:Status;lesson:number|null;progress:number;reason?:string;note?:string;topic?:string;book?:number;level?:number}
export interface PracticeEntry extends Entry {date:string;minutes:number;kind?:'practice'|'lesson';songs?:string[];focus?:string;note?:string;instrument?:string;activity?:string;name?:string;feel?:Feel}
// A practice subject's weekly goal, in days. One entry per subject; saving it again replaces it.
// Mom checked a finished lesson and every answer is right. One entry per lesson; removing it takes the check back.
export interface CheckedEntry extends Entry {subject:'checked';of:string;book:number;lesson:number;date:string}
export const checkedId=(subject:string,book:number,lesson:number)=>`checked-${subject}-${book}-${lesson}`;
export interface GoalEntry extends Entry {subject:'goal';of:string;days:number}

// Entries saved before subjects existed are math.
const upcast=(payload:Record<string,unknown>)=>payload.subject?payload:{...payload,subject:'math'};

export function materialize(events:readonly StoredEvent[]):Entry[] {
  const entries=new Map<string,Entry>();
  for(const event of [...events].sort((a,b)=>a.seq-b.seq)) {
    if(event.operation==='remove') entries.delete(event.entry_id);
    else entries.set(event.entry_id,{...upcast(JSON.parse(event.payload)),id:event.entry_id,seq:event.seq} as Entry);
  }
  return [...entries.values()].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.seq-b.seq);
}
