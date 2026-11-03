import {BASE_DATE,TARGETS,today,pretty,addDays,summarize} from './math.js';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>Number.isInteger(value)?String(value):String(Math.round(value*100)/100);
let state={entries:[],revision:0}, summary, selectedBook=5, ready=false, editingId=null, deleteId=null, toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function availability(){ $$('[data-status],#add-entry,#export,#catchup-button').forEach(b=>b.disabled=!ready); }
async function load(){
  $('#connection').textContent='Syncing your progress…';
  try{
    const response=await fetch('/api/state',{cache:'no-store'});
    if(!response.ok) throw new Error('Could not connect');
    state=await response.json();ready=true;render();
    $('#connection').className='';$('#connection').textContent='✓ Progress synced';
  }catch(error){ready=false;$('#connection').className='error';$('#connection').textContent='Could not sync. Check your connection, then tap Refresh progress.';}
  availability();
  return ready;
}
async function mutate(operation,entryId,entry){
  const response=await fetch('/api/entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,entryId,entry,revision:state.revision,requestId:crypto.randomUUID()})});
  const data=await response.json();
  if(!response.ok){
    if(response.status===409){await load();throw new Error('Newer progress has been loaded. Your form is still here. Review it and save again.');}
    throw new Error(data.error||'Could not save. Please try again.');
  }
  if(!await load()) throw new Error('Your check-in was saved, but the refreshed view could not load. Please refresh before making another change.');
}
function render(){
  summary=summarize(state.entries);
  const day=today();
  $('#today-label').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/New_York'}).format(new Date()).toUpperCase()+' · YOUR NEXT CHAPTER';
  const allDone=summary.totals[5]===120&&summary.totals[6]===120;
  $('#next-heading').textContent=allDone?'You did it, Ninja! ✦':`Math ${summary.active} · Lesson ${summary.nextLesson}`;
  $('#next-subtitle').textContent=allDone?'Both books are finished. Look at everything you’ve learned.':summary.progress[summary.active][summary.nextLesson-1]>0?'Pick up where you left off. Every bit of practice counts.':summary.backlog.length?'Your next new lesson is ready. There are also a few loose ends below.':'Your next little adventure. Let’s make it a good one.';
  $('#today-state').textContent=summary.loggedToday?'Checked in today ✓':'Your pace, your journey';
  $('#today-message').textContent=summary.loggedToday?'Your effort is saved. More math today? You can check in again.':'One lesson at a time. You’ve got this.';
  $('#goals').innerHTML=[5,6].map(book=>{
    const total=summary.totals[book],complete=total===120,finished=summary.progress[book].filter(p=>p===1).length,projected=book===5?summary.math5:summary.math6;
    return `<article class="goal ${summary.active===book?'active-goal':''}"><div class="goal-top"><span class="book-icon">${book}</span><div class="goal-title"><h3>Math ${book}</h3><span class="small muted">${book===5?'Build your foundation':'Level up your superpowers'}</span></div><span class="goal-badge">${complete?'COMPLETE ✓':summary.active===book?'IN PROGRESS':'NEXT CHAPTER'}</span></div><div class="progress-label"><strong>${finished} / 120 lessons finished</strong><span>${Math.round(total/120*100)}%</span></div><progress value="${total}" max="120" aria-label="Math ${book} progress"></progress><div class="goal-dates"><div><span>${complete?'Finished on':'Projected finish'}</span><strong>${pretty(projected,true)}</strong></div><div><span>Original target</span><strong>${pretty(TARGETS[book],true)}</strong></div></div><p class="goal-foot">${book===6?`Starts ${pretty(summary.math6Start,true)} · the next weekday after Math 5`:`${num(120-total)} lesson-equivalents to go${summary.backlog.length?' · includes unfinished catch-up work':''}`}</p></article>`;
  }).join('');
  const total=summary.totals[5]+summary.totals[6];
  $('#overall-percent').textContent=Math.round(total/240*100)+'%';
  $('#progress-ring').style.strokeDashoffset=String(465*(1-total/240));
  $('#finished-count').textContent=summary.progress[5].concat(summary.progress[6]).filter(p=>p===1).length;
  $('#remaining-count').textContent=num(240-total);
  $('#catchup').hidden=!summary.backlog.length;
  $('#catchup-copy').textContent=`Lessons ${summary.backlog.join(', ')} still need a final check. Finish these whenever you’re ready.`;
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();const monday=addDays(day,-((weekday+6)%7));
  let worked=0;
  $('#week-strip').innerHTML=Array.from({length:7},(_,i)=>{
    const date=addDays(monday,i),entries=state.entries.filter(e=>e.date===date),work=entries.some(e=>e.status!=='skipped'),rest=entries.length&&!work;
    if(work)worked++;
    return `<div class="day ${work?'logged':rest?'rest':''} ${date===day?'current':''}" title="${pretty(date)}: ${work?'Work logged':rest?'Break logged':'Not logged'}">${['M','T','W','T','F','S','S'][i]}<span>${work?'✓':rest?'☁':Number(date.slice(8))}</span></div>`;
  }).join('');
  $('#week-message').textContent=worked?`${worked} day${worked===1?'':'s'} of practice this week. That’s effort worth celebrating.`:'A fresh week of possibilities. Your check-ins will appear here.';
  renderMap();renderHistory();
}
function renderMap(){
  $('#lesson-map').innerHTML=summary.progress[selectedBook].map((p,i)=>{
    const label=p===1?'finished':p>0?`${p*100}% complete`:selectedBook===5&&i>=68&&i<74?'catch-up pending':'not started';
    return `<button class="lesson ${p===1?'done':p>0?'part':selectedBook===5&&i>=68&&i<74?'pending':''}" data-lesson="${i+1}" title="Lesson ${i+1}: ${label}" aria-label="Math ${selectedBook}, lesson ${i+1}, ${label}">${i+1}</button>`;
  }).join('');
}
function renderHistory(){
  $('#history-list').innerHTML=state.entries.length?[...state.entries].reverse().map(e=>`<article class="history-item"><span class="history-symbol" aria-hidden="true">${e.status==='complete'?'✓':e.status==='partial'?'◕':'☁'}</span><div class="history-body"><h3>${e.status==='skipped'?'A day to recharge':`Math ${e.book} · Lesson ${e.lesson} · ${e.status==='complete'?'Finished!':`${e.progress*100}% complete`}`}</h3><small>${pretty(e.date,true)}${e.reason?' · '+esc(e.reason):''}</small>${e.note?`<p>${esc(e.note)}</p>`:''}</div><div class="history-tools"><button data-edit="${esc(e.id)}" aria-label="Edit check-in from ${pretty(e.date)}">Edit</button><button data-delete="${esc(e.id)}" aria-label="Remove check-in from ${pretty(e.date)}">Remove</button></div></article>`).join(''):'<div class="empty"><span class="empty-star">✧</span><h2>Your story starts here.</h2><p>Log a lesson, a little progress, or a day off. This is your space.</p></div>';
}
function syncFields(){
  const status=$('#entry-status').value;
  $('#lesson-fields').hidden=status==='skipped';$('#entry-lesson').required=status!=='skipped';
  $('#amount-field').hidden=status!=='partial';$('#partial-hint').hidden=status!=='partial';
}
function openEntry(status='complete',book=summary.active,lesson=summary.nextLesson,existing=null){
  if(!ready)return;
  editingId=existing?.id||crypto.randomUUID();
  $('#entry-form').reset();$('#form-error').textContent='';
  $('#dialog-title').textContent=existing?'Make your check-in just right.':status==='skipped'?'Rest is part of the journey.':status==='partial'?'Little steps still move you forward.':'A little progress, a big win.';
  $('#entry-date').min=BASE_DATE;$('#entry-date').max=today();$('#entry-date').value=existing?.date||today();
  $('#entry-book').value=existing?.book||book;$('#entry-lesson').value=existing?.lesson||lesson||120;
  $('#entry-status').value=existing?.status||status;
  const p=existing?.progress||summary.progress[book][lesson-1]||0.5;
  $('#entry-progress').value=p===1?'0.5':String(p);
  $('#entry-note').value=existing?.note||'';$('#entry-reason').value=existing?.reason||'';
  syncFields();$('#entry-dialog').showModal();
}
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-view]').forEach(b=>b.classList.toggle('active',b===button));
  $('#dashboard').hidden=button.dataset.view!=='dashboard';$('#history').hidden=button.dataset.view!=='history';
}));
$$('[data-status]').forEach(button=>button.addEventListener('click',()=>openEntry(button.dataset.status)));
$$('[data-book]').forEach(button=>button.addEventListener('click',()=>{
  selectedBook=Number(button.dataset.book);$$('[data-book]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});if(ready)renderMap();
}));
$('#lesson-map').addEventListener('click',event=>{
  const button=event.target.closest('[data-lesson]');if(!button||!ready)return;
  const lesson=Number(button.dataset.lesson),p=summary.progress[selectedBook][lesson-1];
  const existing=[...state.entries].reverse().find(e=>e.book===selectedBook&&e.lesson===lesson&&e.date===today());
  openEntry(p>0&&p<1?'partial':'complete',selectedBook,lesson,existing||null);
});
$('#history-list').addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit]'),remove=event.target.closest('[data-delete]');
  if(edit){const entry=state.entries.find(e=>e.id===edit.dataset.edit);openEntry(entry.status,entry.book,entry.lesson,entry);}
  if(remove){deleteId=remove.dataset.delete;$('#delete-error').textContent='';$('#delete-dialog').showModal();}
});
$$('.close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('#entry-status').addEventListener('change',syncFields);
$('#add-entry').addEventListener('click',()=>openEntry());
$('#refresh').addEventListener('click',load);
$('#entry-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!ready){$('#form-error').textContent='Please reconnect using Refresh progress before saving.';return;}
  const button=event.submitter;button.disabled=true;$('#form-error').textContent='';
  const status=$('#entry-status').value;
  const entry={date:$('#entry-date').value,book:Number($('#entry-book').value),lesson:status==='skipped'?null:Number($('#entry-lesson').value),status,progress:status==='complete'?1:status==='partial'?Number($('#entry-progress').value):0,reason:$('#entry-reason').value,note:$('#entry-note').value};
  try{await mutate('save',editingId,entry);$('#entry-dialog').close();toast(status==='complete'?'Lesson saved. That’s ninja energy! ✦':status==='partial'?'Progress saved. Every little bit counts.':'Break logged. Tomorrow is a fresh start.');}
  catch(error){$('#form-error').textContent=error.message;}finally{button.disabled=false;}
});
$('#confirm-delete').addEventListener('click',async event=>{
  event.target.disabled=true;
  try{await mutate('remove',deleteId);$('#delete-dialog').close();toast('Check-in removed. Your dates are updated.');}
  catch(error){$('#delete-error').textContent=error.message;}finally{event.target.disabled=false;}
});
$('#catchup-button').addEventListener('click',()=>{
  $('#catchup-options').innerHTML=summary.backlog.map(lesson=>`<label>Lesson ${lesson}<input type="checkbox" value="${lesson}" aria-label="Lesson ${lesson} fully finished"></label>`).join('');
  $('#catchup-error').textContent='';$('#catchup-dialog').showModal();
});
$('#save-catchup').addEventListener('click',async event=>{
  const selected=$$('#catchup-options input:checked');if(!selected.length){$('#catchup-error').textContent='Select at least one finished lesson.';return;}
  event.target.disabled=true;$('#catchup-error').textContent='';
  try{
    for(const box of selected){
      await mutate('save',crypto.randomUUID(),{date:today(),book:5,lesson:Number(box.value),status:'complete',progress:1,reason:'',note:''});
      box.checked=false;box.disabled=true;
    }
    $('#catchup-dialog').close();toast('Loose ends, tied up. Beautiful work! ✦');
  }catch(error){$('#catchup-error').textContent=error.message+' Any already-saved lessons are unchecked.';}finally{event.target.disabled=false;}
});
$('#export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),baseline:{date:BASE_DATE,math5Finished:68},...state},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ninja-progress-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('online',()=>{if(!document.querySelector('dialog[open]'))load();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!document.querySelector('dialog[open]'))load();});
load();
