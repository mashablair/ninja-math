import {BASE_DATE,TARGETS,today,pretty,addDays,weekday,summarize} from './math.js';
import {dailyMessage,bookCheer,celebrateMessage,partialMessage,breakMessage} from './messages.js';
import {celebrate,initCelebration} from './celebrate.js';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>Number.isInteger(value)?String(value):String(Math.round(value*100)/100);
const finishedIn=(s,book)=>s.progress[book].filter(p=>p===1).length;
const percentOf=(s,book)=>s.totals[book]===120?100:Math.min(99,Math.round(s.totals[book]*100/120));
const ICONS={
  complete:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  partial:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 4a8 8 0 1 0 8 8h-8z"/></svg>',
  skipped:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
};
let state={entries:[],revision:0}, summary, selectedBook=5, bookChosen=false, ready=false, editingId=null, deleteId=null, toastTimer, justEarned=null;

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
  if(!bookChosen) setBook(summary.active,false);
  const day=today(), active=summary.active;
  const todays=state.entries.filter(e=>e.date===day);
  $('#today-label').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/New_York'}).format(new Date());
  $('#daily-message').textContent=dailyMessage(day,{loggedToday:summary.loggedToday,lastStatus:todays.at(-1)?.status});

  const allDone=summary.totals[5]===120&&summary.totals[6]===120;
  const inProgress=!allDone&&summary.progress[active][summary.nextLesson-1]>0;
  $('#next-heading').textContent=allDone?'You did it!':`Lesson ${summary.nextLesson}`;
  $('#next-book').textContent=allDone?'Both books finished':`Math ${active}`;
  $('#next-subtitle').textContent=allDone?'Math 5 and Math 6 are complete. Look at everything you’ve learned.':inProgress?'Pick up where you left off. You’ve already started this one.':summary.loggedToday?'You checked in today. Want to do more? You can check in again.':'Your next lesson is ready when you are.';
  $('#today-state').textContent=summary.loggedToday?'Checked in today ✓':'';

  const pct=percentOf(summary,active);
  $('#book-percent').textContent=pct+'%';
  $('#book-percent-label').textContent=`of Math ${active}`;
  $('#progress-ring').style.strokeDashoffset=String(465*(1-summary.totals[active]/120));
  $('#book-count').textContent=`${finishedIn(summary,active)} of 120 lessons`;
  $('#book-cheer').textContent=bookCheer(pct);

  const backlog=summary.backlog;
  $('#catchup').hidden=!backlog.length;
  const contiguous=backlog.length>1&&backlog.at(-1)-backlog[0]===backlog.length-1;
  $('#catchup-title').textContent=backlog.length===1?`Lesson ${backlog[0]}`:contiguous?`Lessons ${backlog[0]}–${backlog.at(-1)}`:`Lessons ${backlog.join(', ')}`;
  $('#catchup-copy').textContent=`Did you finish ${backlog.length===1?'this one':'any of these'}? Check them off so they become stickers.`;

  const weekdayNum=new Date(day+'T12:00:00Z').getUTCDay();const monday=addDays(day,-((weekdayNum+6)%7));
  let worked=0;
  $('#week-strip').innerHTML=Array.from({length:7},(_,i)=>{
    const date=addDays(monday,i),entries=state.entries.filter(e=>e.date===date),work=entries.some(e=>e.status!=='skipped'),rest=entries.length&&!work;
    if(work)worked++;
    return `<div class="day ${work?'logged':rest?'rest':''} ${date===day?'current':''}" title="${pretty(date)}: ${work?'Math done':rest?'Break':'Not logged'}">${['M','T','W','T','F','S','S'][i]}<span>${work?'✓':rest?'☾':Number(date.slice(8))}</span></div>`;
  }).join('');
  $('#week-message').textContent=worked?`${worked} day${worked===1?'':'s'} of math this week. Nice work!`:'Your check-ins will show up here.';
  renderMap();renderPlanning();renderHistory();
}

function setBook(book,chosen=true){
  selectedBook=book;if(chosen)bookChosen=true;
  $$('[data-book]').forEach(b=>{const on=Number(b.dataset.book)===book;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
}
function renderMap(){
  const book=selectedBook, finished=finishedIn(summary,book);
  $('#collection-title').textContent=`My Math ${book} collection`;
  $('#collection-copy').textContent=book===6&&summary.active===5?'Math 6 stickers start after Math 5. You’re getting there!':`${finished} sticker${finished===1?'':'s'} so far. Tap a lesson to update it.`;
  $('#lesson-map').innerHTML=summary.progress[book].map((p,i)=>{
    const n=i+1, check=book===5&&summary.backlog.includes(n), isToday=book===summary.active&&n===summary.nextLesson&&p<1;
    const cls=p===1?'done':p>0?'part':check?'check':isToday?'today':'';
    const label=p===1?'finished':p>0?`${p*100}% done`:check?'needs a check':isToday?'today’s lesson':'coming up';
    const earned=justEarned&&justEarned.book===book&&justEarned.lessons.includes(n)?' just-earned':'';
    return `<button class="lesson ${cls}${earned}" data-lesson="${n}" title="Lesson ${n}: ${label}" aria-label="Math ${book}, lesson ${n}, ${label}">${n}</button>`;
  }).join('');
  justEarned=null;
}

const TL_START='2026-11-01', TL_END='2027-08-31', SCHOOL='2027-08-01', IOWA='2027-05-26';
const dayIndex=date=>(Date.parse(date+'T12:00:00Z')-Date.parse(TL_START+'T12:00:00Z'))/86400000;
const tlPos=date=>Math.max(0,Math.min(100,dayIndex(date)/dayIndex(TL_END)*100));
function schoolDaysBetween(from,to){let n=0,d=from;while(d<to){d=addDays(d,1);if(weekday(d))n++;}return n;}
function renderPlanning(){
  $('#goals').innerHTML=[5,6].map(book=>{
    const total=summary.totals[book],complete=total===120,finished=finishedIn(summary,book),projected=book===5?summary.math5:summary.math6,target=TARGETS[book];
    const diff=complete?'':projected>target?`${schoolDaysBetween(target,projected)} school days after target`:projected<target?`${schoolDaysBetween(projected,target)} school days ahead of target`:'Right on target';
    return `<article class="goal ${summary.active===book?'active-goal':''}"><div class="goal-top"><span class="book-icon">${book}</span><div class="goal-title"><h3>Math ${book}</h3><span>${book===5?'Build your foundation':'Level up'}</span></div><span class="goal-badge">${complete?'Complete ✓':summary.active===book?'In progress':'Up next'}</span></div><div class="progress-label"><strong>${finished} / 120 lessons</strong><span class="muted">${percentOf(summary,book)}%</span></div><div class="bar"><span data-width="${total/120*100}"></span></div><div class="goal-dates"><div><span>${complete?'Finished on':'Projected finish'}</span><strong>${pretty(projected,true)}</strong></div><div><span>Original target</span><strong>${pretty(target,true)}</strong></div></div>${diff?`<span class="goal-diff">${diff}</span>`:''}<p class="goal-foot">${book===6?`Starts ${pretty(summary.math6Start,true)}, the next weekday after Math 5`:`${num(120-total)} lesson-equivalents to go${summary.backlog.length?` · includes ${summary.backlog.length} lesson${summary.backlog.length===1?'':'s'} to confirm`:''}`}</p></article>`;
  }).join('');
  $$('#goals [data-width]').forEach(el=>el.style.width=el.dataset.width+'%');

  const day=today(), months=['2026-11-01','2026-12-01','2027-01-01','2027-02-01','2027-03-01','2027-04-01','2027-05-01','2027-06-01','2027-07-01','2027-08-01'];
  const parts=months.map(m=>`<span class="tl-month" data-left="${tlPos(m)}">${pretty(m).split(' ')[0]}</span>`);
  parts.push('<div class="tl-track"></div>');
  const seg=(cls,from,to,label)=>{const l=tlPos(from),w=Math.max(0,tlPos(to)-l);if(w>0)parts.push(`<div class="tl-seg ${cls}" data-left="${l}" data-width="${w}">${label}</div>`);};
  if(summary.totals[5]<120) seg('m5',day,summary.math5,'Math 5');
  if(summary.totals[6]<120) seg('m6',summary.totals[5]<120?summary.math6Start:day,summary.math6,'Math 6');
  if(summary.math6<SCHOOL) seg('buffer',addDays(summary.math6,1),SCHOOL,'Buffer');
  seg('school',SCHOOL,TL_END,'7th grade');
  const mark=(cls,date,label,top)=>{parts.push(`<div class="tl-mark ${cls}" data-left="${tlPos(date)}"></div><span class="tl-label ${cls}" data-left="${tlPos(date)}" data-top="${top}">${label}</span>`);};
  mark('now',day,'Today',96);
  mark('',TARGETS[5],'Target Jan 6',102);
  mark('',IOWA,'Iowa test (late May)',102);
  mark('',TARGETS[6],'Target Jun 23',124);
  $('#timeline').innerHTML=parts.join('');
  $$('#timeline [data-left]').forEach(el=>{el.style.left=el.dataset.left+'%';if(el.dataset.width)el.style.width=el.dataset.width+'%';if(el.dataset.top)el.style.top=el.dataset.top+'px';});
  $$('#timeline .tl-label.now').forEach(el=>el.style.transform='none');
  $('#timeline-note').textContent=summary.math6<SCHOOL?`At this pace Math 6 wraps up ${pretty(summary.math6,true)}, leaving a buffer before 7th grade in August (exact date TBD).`:`At this pace Math 6 wraps up ${pretty(summary.math6,true)}, which runs into August. Extra or weekend lessons would bring it earlier.`;
}

function renderHistory(){
  $('#history-list').innerHTML=state.entries.length?[...state.entries].reverse().map(e=>`<article class="history-item"><span class="history-symbol ${e.status}">${ICONS[e.status]||''}</span><div class="history-body"><h3>${e.status==='skipped'?'A day to recharge':`Math ${e.book} · Lesson ${e.lesson} · ${e.status==='complete'?'Finished!':`${e.progress*100}% done`}`}</h3><small>${pretty(e.date,true)}${e.reason?' · '+esc(e.reason):''}</small>${e.note?`<p>${esc(e.note)}</p>`:''}</div><div class="history-tools"><button data-edit="${esc(e.id)}" aria-label="Edit check-in from ${pretty(e.date)}">Edit</button><button data-delete="${esc(e.id)}" aria-label="Remove check-in from ${pretty(e.date)}">Remove</button></div></article>`).join(''):'<div class="empty"><img src="/ninja.svg" alt="" width="72" height="72"><h2>Your story starts here.</h2><p>Log a lesson, a little progress, or a day off. This is your space.</p></div>';
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
  $('#dialog-title').textContent=existing?'Make your check-in just right.':status==='skipped'?'Rest is part of learning.':status==='partial'?'Little steps still count.':'Woohoo! Let’s add your sticker.';
  $('#entry-date').min=BASE_DATE;$('#entry-date').max=today();$('#entry-date').value=existing?.date||today();
  $('#entry-book').value=existing?.book||book;$('#entry-lesson').value=existing?.lesson||lesson||120;
  $('#entry-status').value=existing?.status||status;
  const p=existing?.progress||summary.progress[book][lesson-1]||0.5;
  $('#entry-progress').value=p===1?'0.5':String(p);
  $('#entry-note').value=existing?.note||'';$('#entry-reason').value=existing?.reason||'';
  syncFields();$('#entry-dialog').showModal();
}
function celebrateLessons(book,lessons,before){
  const finished=finishedIn(summary,book), pctBefore=percentOf(before,book), pctAfter=percentOf(summary,book), bookDone=summary.totals[book]===120;
  const many=lessons.length>1;
  celebrate({
    sticker:bookDone?'★':many?lessons.length:lessons[0],
    title:bookDone?`Math ${book} complete!`:many?`${lessons.length} lessons checked off!`:`Lesson ${lessons[0]} is done!`,
    message:many&&!bookDone?'Loose ends, all tied up. Beautiful work!':celebrateMessage({finished,book,bookDone,percentBefore:pctBefore,percentAfter:pctAfter}),
    book,percent:pctAfter,count:`${finished} of 120 lessons`
  });
}

/* ---------- Views & events ---------- */
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-view]').forEach(b=>{const on=b===button;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  ['dashboard','history','planning'].forEach(view=>$('#'+view).hidden=button.dataset.view!==view);
  window.scrollTo({top:0});
}));
$$('[data-status]').forEach(button=>button.addEventListener('click',()=>openEntry(button.dataset.status)));
$$('[data-book]').forEach(button=>button.addEventListener('click',()=>{setBook(Number(button.dataset.book));if(ready)renderMap();}));
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
  event.preventDefault();if(!ready&&!await load()){$('#form-error').textContent='Still unable to connect. Your form is saved here; try Save again when you are online.';return;}
  const button=event.submitter;button.disabled=true;$('#form-error').textContent='';
  const status=$('#entry-status').value;
  const entry={date:$('#entry-date').value,book:Number($('#entry-book').value),lesson:status==='skipped'?null:Number($('#entry-lesson').value),status,progress:status==='complete'?1:status==='partial'?Number($('#entry-progress').value):0,reason:$('#entry-reason').value,note:$('#entry-note').value};
  const before=summary, wasDone=status==='complete'&&before.progress[entry.book][entry.lesson-1]===1;
  try{
    if(status==='complete'&&!wasDone) justEarned={book:entry.book,lessons:[entry.lesson]};
    await mutate('save',editingId,entry);$('#entry-dialog').close();
    if(status==='complete'&&!wasDone&&summary.progress[entry.book][entry.lesson-1]===1) celebrateLessons(entry.book,[entry.lesson],before);
    else toast(status==='complete'?'Saved! Nice work.':status==='partial'?partialMessage():breakMessage());
  }
  catch(error){justEarned=null;$('#form-error').textContent=error.message;}finally{button.disabled=false;}
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
  const before=summary, saved=[];
  try{
    for(const box of selected){
      const lesson=Number(box.value);justEarned={book:5,lessons:[...saved,lesson]};
      await mutate('save',crypto.randomUUID(),{date:today(),book:5,lesson,status:'complete',progress:1,reason:'',note:''});
      saved.push(lesson);box.checked=false;box.disabled=true;
    }
    $('#catchup-dialog').close();celebrateLessons(5,saved,before);
  }catch(error){$('#catchup-error').textContent=error.message+' Any already-saved lessons are unchecked.';}finally{event.target.disabled=false;}
});
$('#export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),baseline:{date:BASE_DATE,math5Finished:68},...state},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ninja-progress-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

/* ---------- Tweaks (saved per device) ---------- */
const TWEAKS=['color','mode','text','effects'];
function syncThemeColor(){
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#fbf8f4';
}
function initTweaks(){
  const form=$('#tweaks-form'), root=document.documentElement;
  TWEAKS.forEach(key=>{const input=form.querySelector(`input[name="${key}"][value="${root.dataset[key]}"]`);if(input)input.checked=true;});
  form.addEventListener('change',event=>{
    const {name,value}=event.target;if(!TWEAKS.includes(name))return;
    root.dataset[name]=value;
    const saved=Object.fromEntries(TWEAKS.map(key=>[key,root.dataset[key]]));
    try{localStorage.setItem('ninja-tweaks',JSON.stringify(saved));}catch(error){}
    syncThemeColor();
  });
  $('#tweaks-button').addEventListener('click',()=>$('#tweaks-dialog').showModal());
  $('#preview-celebration').addEventListener('click',()=>{
    $('#tweaks-dialog').close();
    const book=summary?.active||5;
    celebrate({sticker:summary?.nextLesson||75,title:'This is what finishing looks like!',message:'Finish a lesson to earn the real thing.',book,percent:summary?percentOf(summary,book):57,count:summary?`${finishedIn(summary,book)} of 120 lessons`:''});
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',syncThemeColor);
  syncThemeColor();
}

initCelebration();initTweaks();
window.addEventListener('online',()=>{if(!document.querySelector('dialog[open]'))load();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!document.querySelector('dialog[open]'))load();});
load();
