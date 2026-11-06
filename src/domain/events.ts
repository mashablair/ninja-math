// D1 keeps an append-only log of events. The current check-ins are derived by replaying it.
export type Operation='save'|'remove';
export interface StoredEvent {seq:number;entry_id:string;operation:Operation;payload:string;request_id?:string;created_at?:string}
export interface Entry {id:string;seq:number;subject:string;date?:string;[field:string]:unknown}

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
