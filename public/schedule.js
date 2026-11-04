export function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function addDays(day,n) { const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function weekday(day) { const n=new Date(day+'T12:00:00Z').getUTCDay(); return n!==0&&n!==6; }
export function nextSchoolDay(day,include=false) { let d=include?day:addDays(day,1); while(!weekday(d)) d=addDays(d,1); return d; }
export function finishDate(start,slots) { let day=nextSchoolDay(start,true); for(let i=1;i<slots;i++) day=nextSchoolDay(day); return day; }
export function pretty(day,year=false) { return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')); }
export function materialize(events) {
  const entries=new Map();
  for(const event of [...events].sort((a,b)=>a.seq-b.seq)) {
    if(event.operation==='remove') entries.delete(event.entry_id);
    else entries.set(event.entry_id,{...JSON.parse(event.payload),id:event.entry_id,seq:event.seq});
  }
  return [...entries.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.seq-b.seq);
}
