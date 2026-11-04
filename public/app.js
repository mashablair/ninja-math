import {BASE_DATE,TARGETS,today,pretty,addDays,weekday,summarize} from './math.js';
import {summarize as summarizeEnglish,TARGET as ENGLISH_TARGET,BASE_DATE as ENGLISH_BASE} from './english.js';
import {summarize as summarizeMusic,INSTRUMENTS} from './music.js';
import * as mathCopy from './messages/math.js';
import * as englishCopy from './messages/english.js';
import * as musicCopy from './messages/music.js';
import {celebrate,initCelebration} from './celebrate.js';
const copy={math:mathCopy,english:englishCopy,music:musicCopy};
const MASCOT={math:'/unicorn.svg',english:'/unicorn-english.svg',music:'/unicorn-music.svg'};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>Number.isInteger(value)?String(value):String(Math.round(value*100)/100);
const isMath=entry=>!entry.subject||entry.subject==='math';
const finishedIn=(s,book)=>s.progress[book].filter(p=>p===1).length;
const percentOf=(s,book)=>s.totals[book]===120?100:Math.min(99,Math.round(s.totals[book]*100/120));
const percentOfTotal=total=>total===120?100:Math.min(99,Math.round(total*100/120));
const instrumentName=id=>INSTRUMENTS.find(item=>item.id===id)?.name||'Music';
const ICONS={
  complete:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  partial:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 4a8 8 0 1 0 8 8h-8z"/></svg>',
  skipped:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  lesson:'♪'
};
let state={entries:[],revision:0}, summary, englishSummary, musicSummary, selectedBook=5, bookChosen=false, ready=false, editingId=null, editingSubject='math', editingExisting=false, deleteId=null, toastTimer, justEarned=null, subject='math';
try{const saved=localStorage.getItem('ninja-subject');if(['math','english','music'].includes(saved))subject=saved;}catch(error){}

function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function availability(){ $$('[data-status],[data-en-status],#music-practice,#music-lesson,#add-entry,#export,#catchup-button').forEach(b=>b.disabled=!ready); }
function entriesFor(name){return state.entries.filter(entry=>name==='math'?isMath(entry):entry.subject===name);}
function setSubject(next){
  subject=['math','english','music'].includes(next)?next:'math';
  try{localStorage.setItem('ninja-subject',subject);}catch(error){}
  $$('[data-subject]').forEach(button=>{const on=button.dataset.subject===subject;button.classList.toggle('selected',on);button.setAttribute('aria-pressed',String(on));});
  $$('[data-subject-panel]').forEach(panel=>{panel.hidden=panel.dataset.subjectPanel!==subject;});
}
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

function weekStrip(day,pick,doneWord){
  const weekdayNum=new Date(day+'T12:00:00Z').getUTCDay(), monday=addDays(day,-((weekdayNum+6)%7));
  let worked=0;
  const html=Array.from({length:7},(_,i)=>{
    const date=addDays(monday,i), entries=pick(date), work=entries.some(entry=>entry.status!=='skipped'), rest=entries.length&&!work;
    if(work)worked++;
    return `<div class="day ${work?'logged':rest?'rest':''} ${date===day?'current':''}" title="${pretty(date)}: ${work?doneWord:rest?'Break':'Not logged'}">${['M','T','W','T','F','S','S'][i]}<span>${work?'✓':rest?'☾':Number(date.slice(8))}</span></div>`;
  }).join('');
  return {html,worked};
}
function render(){
  summary=summarize(state.entries);
  englishSummary=summarizeEnglish(state.entries);
  musicSummary=summarizeMusic(state.entries);
  if(!bookChosen) setBook(summary.active,false);
  const day=today();
  $('#today-label').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/New_York'}).format(new Date());
  const activeSummary=subject==='english'?englishSummary:subject==='music'?musicSummary:summary;
  const last=entriesFor(subject).filter(entry=>entry.date===day).at(-1);
  $('#daily-message').textContent=copy[subject].dailyMessage(day,{loggedToday:activeSummary.loggedToday,lastStatus:last?.status});
  renderMath(day);renderEnglish(day);renderMusic(day);renderPlanning();renderEnglishPlanning();renderMusicPlanning();renderHistory();
}
function renderMath(day){
  const active=summary.active;
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
  $('#book-cheer').textContent=mathCopy.bookCheer(pct);
  const backlog=summary.backlog;
  $('#catchup').hidden=!backlog.length;
  const contiguous=backlog.length>1&&backlog.at(-1)-backlog[0]===backlog.length-1;
  $('#catchup-title').textContent=backlog.length===1?`Lesson ${backlog[0]}`:contiguous?`Lessons ${backlog[0]}–${backlog.at(-1)}`:`Lessons ${backlog.join(', ')}`;
  $('#catchup-copy').textContent=`Did you finish ${backlog.length===1?'this one':'any of these'}? Check them off so they become stickers.`;
  const week=weekStrip(day,date=>state.entries.filter(entry=>isMath(entry)&&entry.date===date),'Math done');
  $('#week-strip').innerHTML=week.html;
  $('#week-message').textContent=week.worked?`${week.worked} day${week.worked===1?'':'s'} of math this week. Nice work!`:'Your check-ins will show up here.';
  renderMap();
}
function renderEnglish(day){
  const done=englishSummary.total===120, lesson=englishSummary.nextLesson, started=!done&&englishSummary.progress[lesson-1]>0;
  $('#en-next-heading').textContent=done?'You did it!':`Lesson ${lesson}`;
  $('#en-next-book').textContent=done?'English 5 finished':'English 5';
  $('#en-next-subtitle').textContent=done?'English 5 is complete. Look at everything you’ve read.':started?'Pick up where you left off. You’ve already started this one.':englishSummary.loggedToday?'You checked in today. Want to do more? You can check in again.':'Your next lesson is ready when you are.';
  $('#en-today-state').textContent=englishSummary.loggedToday?'Checked in today ✓':'';
  const pct=percentOfTotal(englishSummary.total), finished=englishSummary.progress.filter(part=>part===1).length;
  $('#en-book-percent').textContent=pct+'%';
  $('#en-progress-ring').style.strokeDashoffset=String(465*(1-englishSummary.total/120));
  $('#en-book-count').textContent=`${finished} of 120 lessons`;
  $('#en-book-cheer').textContent=englishCopy.bookCheer(pct);
  $('#en-collection-title').textContent='My English 5 collection';
  $('#en-collection-copy').textContent=`${finished} sticker${finished===1?'':'s'} so far. Tap a lesson to update it.`;
  $('#en-lesson-map').innerHTML=englishSummary.progress.map((part,index)=>{
    const n=index+1, isToday=!done&&n===lesson&&part<1;
    const cls=part===1?'done':part>0?'part':isToday?'today':'';
    const label=part===1?'finished':part>0?`${part*100}% done`:isToday?'today’s lesson':'coming up';
    const earned=justEarned?.subject==='english'&&justEarned.lessons.includes(n)?' just-earned':'';
    return `<button class="lesson ${cls}${earned}" data-en-lesson="${n}" title="Lesson ${n}: ${label}" aria-label="English 5, lesson ${n}, ${label}">${n}</button>`;
  }).join('');
  if(justEarned?.subject==='english') justEarned=null;
  const week=weekStrip(day,date=>state.entries.filter(entry=>entry.subject==='english'&&entry.date===date),'English done');
  $('#en-week-strip').innerHTML=week.html;
  $('#en-week-message').textContent=week.worked?`${week.worked} day${week.worked===1?'':'s'} of English this week. Nice work!`:'Your check-ins will show up here.';
}
function renderMusic(day){
  const todayLogs=musicSummary.entries.filter(entry=>entry.date===day);
  $('#music-today').innerHTML=todayLogs.length?todayLogs.map(entry=>`<div class="music-row"><div><strong>${esc(instrumentName(entry.instrument))}</strong><span>${entry.kind==='lesson'?'Lesson with teacher':'Practice'} · ${entry.minutes} min</span>${entry.focus?`<p>${esc(entry.focus)}</p>`:''}</div><button type="button" data-edit="${esc(entry.id)}">Edit</button></div>`).join(''):'<p class="muted">Nothing saved for today yet. Add a practice when you’re ready.</p>';
  $('#music-minutes').innerHTML=INSTRUMENTS.map(item=>`<div><span>${item.name}</span><strong>${musicSummary.minutes[item.id]} min</strong></div>`).join('');
  const week=weekStrip(day,date=>state.entries.filter(entry=>entry.subject==='music'&&entry.date===date),'Music logged');
  $('#music-week-strip').innerHTML=week.html;
  $('#music-week-message').textContent=week.worked?`${week.worked} day${week.worked===1?'':'s'} of music this week. Nice work!`:'Your practice will show up here.';
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
    const earned=justEarned&&(!justEarned.subject||justEarned.subject==='math')&&justEarned.book===book&&justEarned.lessons.includes(n)?' just-earned':'';
    return `<button class="lesson ${cls}${earned}" data-lesson="${n}" title="Lesson ${n}: ${label}" aria-label="Math ${book}, lesson ${n}, ${label}">${n}</button>`;
  }).join('');
  if(!justEarned?.subject||justEarned.subject==='math') justEarned=null;
}

const TL_START='2026-11-01', TL_END='2027-08-31', SCHOOL='2027-08-01', IOWA='2027-05-26';
const dayIndex=date=>(Date.parse(date+'T12:00:00Z')-Date.parse(TL_START+'T12:00:00Z'))/86400000;
const tlPos=date=>Math.max(0,Math.min(100,dayIndex(date)/dayIndex(TL_END)*100));
function schoolDaysBetween(from,to){let n=0,d=from;while(d<to){d=addDays(d,1);if(weekday(d))n++;}return n;}
function placeTimeline(root){
  $$('[data-left]',root).forEach(el=>{el.style.left=el.dataset.left+'%';if(el.dataset.width)el.style.width=el.dataset.width+'%';if(el.dataset.top)el.style.top=el.dataset.top+'px';});
  $$('.tl-label.now',root).forEach(el=>el.style.transform='none');
}
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
  placeTimeline($('#timeline'));
  $('#timeline-note').textContent=summary.math6<SCHOOL?`At this pace Math 6 wraps up ${pretty(summary.math6,true)}, leaving a buffer before 7th grade in August (exact date TBD).`:`At this pace Math 6 wraps up ${pretty(summary.math6,true)}, which runs into August. Extra or weekend lessons would bring it earlier.`;
}
function renderEnglishPlanning(){
  const total=englishSummary.total, complete=total===120, finished=englishSummary.progress.filter(part=>part===1).length, projected=englishSummary.finish, target=ENGLISH_TARGET;
  const diff=complete?'':projected>target?`${schoolDaysBetween(target,projected)} school days after target`:projected<target?`${schoolDaysBetween(projected,target)} school days ahead of target`:'Right on target';
  $('#en-goals').innerHTML=`<article class="goal active-goal"><div class="goal-top"><span class="book-icon">5</span><div class="goal-title"><h3>English 5</h3><span>One level</span></div><span class="goal-badge">${complete?'Complete ✓':'In progress'}</span></div><div class="progress-label"><strong>${finished} / 120 lessons</strong><span class="muted">${percentOfTotal(total)}%</span></div><div class="bar"><span data-width="${total/120*100}"></span></div><div class="goal-dates"><div><span>${complete?'Finished on':'Projected finish'}</span><strong>${pretty(projected,true)}</strong></div><div><span>Original target</span><strong>${pretty(target,true)}</strong></div></div>${diff?`<span class="goal-diff">${diff}</span>`:''}<p class="goal-foot">${complete?'Every lesson is finished.':`${num(120-total)} lesson-equivalents to go`}</p></article>`;
  $$('#en-goals [data-width]').forEach(el=>el.style.width=el.dataset.width+'%');
  const day=today(), months=['2026-11-01','2026-12-01','2027-01-01','2027-02-01','2027-03-01','2027-04-01','2027-05-01','2027-06-01','2027-07-01','2027-08-01'];
  const parts=months.map(month=>`<span class="tl-month" data-left="${tlPos(month)}">${pretty(month).split(' ')[0]}</span>`);
  parts.push('<div class="tl-track"></div>');
  const from=complete?ENGLISH_BASE:day, left=tlPos(from), width=Math.max(0,tlPos(projected)-left);
  if(width>0) parts.push(`<div class="tl-seg m5" data-left="${left}" data-width="${width}">English 5</div>`);
  parts.push(`<div class="tl-mark now" data-left="${tlPos(day)}"></div><span class="tl-label now" data-left="${tlPos(day)}" data-top="96">Today</span>`);
  parts.push(`<div class="tl-mark" data-left="${tlPos(target)}"></div><span class="tl-label" data-left="${tlPos(target)}" data-top="102">Target Mar 19</span>`);
  $('#en-timeline').innerHTML=parts.join('');
  placeTimeline($('#en-timeline'));
  $('#en-timeline-note').textContent=complete?`English 5 was finished on ${pretty(projected,true)}.`:`At this pace English 5 wraps up ${pretty(projected,true)}. The original target, ${pretty(target,true)}, is the weekday plan from November 4, 2026.`;
}
function renderMusicPlanning(){
  $('#music-week-list').innerHTML=INSTRUMENTS.map(item=>`<div><span>${item.name}</span><strong>${musicSummary.minutes[item.id]} min</strong></div>`).join('');
  const lessons=[...musicSummary.lessons].reverse();
  $('#music-lesson-list').innerHTML=lessons.length?lessons.map(entry=>`<article class="history-item"><span class="history-symbol lesson">${ICONS.lesson}</span><div class="history-body"><h3>${esc(instrumentName(entry.instrument))} · ${entry.minutes} min</h3><small>${pretty(entry.date,true)}</small>${entry.focus?`<p>${esc(entry.focus)}</p>`:''}</div></article>`).join(''):'<p class="muted">Teacher lessons will show up here.</p>';
}
function renderHistory(){
  const list=entriesFor(subject);
  const notes={math:'Lessons 1–68 are your starting progress and don’t have individual check-ins. Edits stay in the private backup history.',english:'Lessons 1–22 are your starting progress and don’t have individual check-ins. Edits stay in the private backup history.',music:'Each practice and each teacher lesson is saved on its own. Edits stay in the private backup history.'};
  $('#history-note').textContent=notes[subject];
  $('#history-list').innerHTML=list.length?[...list].reverse().map(entry=>{
    if(entry.subject==='music') return `<article class="history-item"><span class="history-symbol ${entry.kind==='lesson'?'lesson':'complete'}">${entry.kind==='lesson'?ICONS.lesson:ICONS.complete}</span><div class="history-body"><h3>${esc(instrumentName(entry.instrument))} · ${entry.kind==='lesson'?'Lesson with teacher':'Practice'} · ${entry.minutes} min</h3><small>${pretty(entry.date,true)}</small>${entry.focus?`<p>${esc(entry.focus)}</p>`:''}${entry.note?`<p>${esc(entry.note)}</p>`:''}</div><div class="history-tools"><button data-edit="${esc(entry.id)}" aria-label="Edit check-in from ${pretty(entry.date)}">Edit</button><button data-delete="${esc(entry.id)}" aria-label="Remove check-in from ${pretty(entry.date)}">Remove</button></div></article>`;
    const name=entry.subject==='english'?'English 5':`Math ${entry.book}`;
    return `<article class="history-item"><span class="history-symbol ${entry.status}">${ICONS[entry.status]||''}</span><div class="history-body"><h3>${entry.status==='skipped'?'A day to recharge':`${name} · Lesson ${entry.lesson} · ${entry.status==='complete'?'Finished!':`${entry.progress*100}% done`}`}</h3><small>${pretty(entry.date,true)}${entry.reason?' · '+esc(entry.reason):''}</small>${entry.note?`<p>${esc(entry.note)}</p>`:''}</div><div class="history-tools"><button data-edit="${esc(entry.id)}" aria-label="Edit check-in from ${pretty(entry.date)}">Edit</button><button data-delete="${esc(entry.id)}" aria-label="Remove check-in from ${pretty(entry.date)}">Remove</button></div></article>`;
  }).join(''):`<div class="empty"><img src="/ninja.svg" alt="" width="72" height="72"><h2>${subject==='music'?'Your music starts here.':subject==='english'?'Your English story starts here.':'Your story starts here.'}</h2><p>${subject==='music'?'Log a practice or a lesson with your teacher. This is your space.':'Log a lesson, a little progress, or a day off. This is your space.'}</p></div>`;
}

function syncFields(){
  const music=editingSubject==='music', status=$('#entry-status').value;
  $('#music-fields').hidden=!music;
  $('#status-field').hidden=music;
  $('#book-field').hidden=music||editingSubject==='english';
  $('#entry-context').hidden=editingSubject!=='english';
  $('#lesson-fields').hidden=music||status==='skipped';
  $('#entry-lesson').required=!music&&status!=='skipped';
  $('#entry-minutes').required=music;
  $('#entry-focus').required=music;
  $('#amount-field').hidden=music||status!=='partial';
  $('#partial-hint').hidden=music||status!=='partial';
  $('#reason-field').hidden=music;
}
function openEntry(status='complete',book=summary.active,lesson=summary.nextLesson,existing=null){
  if(!ready)return;
  editingSubject='math';editingExisting=!!existing;editingId=existing?.id||crypto.randomUUID();
  $('#entry-form').reset();$('#form-error').textContent='';
  $('#dialog-title').textContent=existing?'Make your check-in just right.':status==='skipped'?'Rest is part of learning.':status==='partial'?'Little steps still count.':'Woohoo! Let’s add your sticker.';
  $('#entry-date').min=BASE_DATE;$('#entry-date').max=today();$('#entry-date').value=existing?.date||today();
  $('#entry-book').value=existing?.book||book;$('#entry-lesson').value=existing?.lesson||lesson||120;
  $('#entry-status').value=existing?.status||status;
  const progress=existing?.progress||summary.progress[book]?.[lesson-1]||0.5;
  $('#entry-progress').value=progress===1?'0.5':String(progress);
  $('#entry-note').value=existing?.note||'';$('#entry-reason').value=existing?.reason||'';
  syncFields();$('#entry-dialog').showModal();
}
function openEnglish(status='complete',lesson=englishSummary.nextLesson,existing=null){
  if(!ready)return;
  editingSubject='english';editingExisting=!!existing;editingId=existing?.id||crypto.randomUUID();
  $('#entry-form').reset();$('#form-error').textContent='';
  $('#dialog-title').textContent=existing?'Make your check-in just right.':status==='skipped'?'Rest is part of learning.':status==='partial'?'Little steps still count.':'Woohoo! Let’s add your sticker.';
  $('#entry-date').min=ENGLISH_BASE;$('#entry-date').max=today();$('#entry-date').value=existing?.date||today();
  const chosen=existing?.lesson||lesson||120;
  $('#entry-lesson').value=chosen;$('#entry-status').value=existing?.status||status;
  const progress=existing?.progress||englishSummary.progress[chosen-1]||0.5;
  $('#entry-progress').value=progress===1?'0.5':String(progress);
  $('#entry-note').value=existing?.note||'';$('#entry-reason').value=existing?.reason||'';
  syncFields();$('#entry-dialog').showModal();
}
function openMusic(existing=null,kind='practice'){
  if(!ready)return;
  editingSubject='music';editingExisting=!!existing;editingId=existing?.id||crypto.randomUUID();
  $('#entry-form').reset();$('#form-error').textContent='';
  const chosenKind=existing?.kind||kind;
  $('#dialog-title').textContent=existing?'Make your music note just right.':chosenKind==='lesson'?'A lesson with your teacher.':'What did you play?';
  $('#entry-date').min=BASE_DATE;$('#entry-date').max=today();$('#entry-date').value=existing?.date||today();
  const logged=new Set(musicSummary.entries.filter(entry=>entry.date===today()).map(entry=>entry.instrument));
  $('#entry-instrument').value=existing?.instrument||INSTRUMENTS.find(item=>!logged.has(item.id))?.id||'piano';
  $('#entry-kind').value=chosenKind;
  $('#entry-minutes').value=existing?.minutes||20;
  $('#entry-focus').value=existing?.focus||'';
  $('#entry-note').value=existing?.note||'';
  syncFields();$('#entry-dialog').showModal();
}
function editEntry(id){
  const entry=state.entries.find(item=>item.id===id);if(!entry)return;
  if(entry.subject==='music') openMusic(entry);
  else if(entry.subject==='english') openEnglish(entry.status,entry.lesson,entry);
  else openEntry(entry.status,entry.book,entry.lesson,entry);
}
function celebrateLessons(book,lessons,before){
  const finished=finishedIn(summary,book), pctBefore=percentOf(before,book), pctAfter=percentOf(summary,book), bookDone=summary.totals[book]===120;
  const many=lessons.length>1;
  celebrate({
    sticker:bookDone?'★':many?lessons.length:lessons[0],
    title:bookDone?`Math ${book} complete!`:many?`${lessons.length} lessons checked off!`:`Lesson ${lessons[0]} is done!`,
    message:many&&!bookDone?'Loose ends, all tied up. Beautiful work!':mathCopy.celebrateMessage({finished,book,bookDone,percentBefore:pctBefore,percentAfter:pctAfter}),
    label:`Math ${book}`,percent:pctAfter,count:`${finished} of 120 lessons`,mascot:MASCOT.math
  });
}
function celebrateEnglish(lessons,before){
  const finished=englishSummary.progress.filter(part=>part===1).length, pctBefore=percentOfTotal(before.total), pctAfter=percentOfTotal(englishSummary.total), done=englishSummary.total===120;
  celebrate({
    sticker:done?'★':lessons[0],
    title:done?'English 5 complete!':`Lesson ${lessons[0]} is done!`,
    message:englishCopy.celebrateMessage({finished,done,percentBefore:pctBefore,percentAfter:pctAfter}),
    label:'English 5',percent:pctAfter,count:`${finished} of 120 lessons`,mascot:MASCOT.english
  });
}
function celebrateMusic(entry){
  const name=instrumentName(entry.instrument);
  celebrate({
    sticker:entry.minutes,
    title:entry.kind==='lesson'?`${name} lesson saved!`:`${name} practice saved!`,
    message:musicCopy.celebrateMessage(),
    mascot:MASCOT.music
  });
}

/* ---------- Views & events ---------- */
setSubject(subject);
$$('[data-subject]').forEach(button=>button.addEventListener('click',()=>{setSubject(button.dataset.subject);if(ready)render();}));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-view]').forEach(b=>{const on=b===button;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  ['dashboard','history','planning'].forEach(view=>$('#'+view).hidden=button.dataset.view!==view);
  window.scrollTo({top:0});
}));
$$('[data-status]').forEach(button=>button.addEventListener('click',()=>openEntry(button.dataset.status)));
$$('[data-en-status]').forEach(button=>button.addEventListener('click',()=>openEnglish(button.dataset.enStatus)));
$$('[data-book]').forEach(button=>button.addEventListener('click',()=>{setBook(Number(button.dataset.book));if(ready)renderMap();}));
$('#lesson-map').addEventListener('click',event=>{
  const button=event.target.closest('[data-lesson]');if(!button||!ready)return;
  const lesson=Number(button.dataset.lesson),progress=summary.progress[selectedBook][lesson-1];
  const existing=[...state.entries].reverse().find(entry=>isMath(entry)&&entry.book===selectedBook&&entry.lesson===lesson&&entry.date===today());
  openEntry(progress>0&&progress<1?'partial':'complete',selectedBook,lesson,existing||null);
});
$('#en-lesson-map').addEventListener('click',event=>{
  const button=event.target.closest('[data-en-lesson]');if(!button||!ready)return;
  const lesson=Number(button.dataset.enLesson),progress=englishSummary.progress[lesson-1];
  const existing=[...state.entries].reverse().find(entry=>entry.subject==='english'&&entry.lesson===lesson&&entry.date===today());
  openEnglish(progress>0&&progress<1?'partial':'complete',lesson,existing||null);
});
$('#history-list').addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit]'),remove=event.target.closest('[data-delete]');
  if(edit) editEntry(edit.dataset.edit);
  if(remove){deleteId=remove.dataset.delete;$('#delete-error').textContent='';$('#delete-dialog').showModal();}
});
$('#music-today').addEventListener('click',event=>{const edit=event.target.closest('[data-edit]');if(edit)editEntry(edit.dataset.edit);});
$$('.close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('#entry-status').addEventListener('change',syncFields);
$('#add-entry').addEventListener('click',()=>{if(subject==='music')openMusic();else if(subject==='english')openEnglish();else openEntry();});
$('#music-practice').addEventListener('click',()=>openMusic(null,'practice'));
$('#music-lesson').addEventListener('click',()=>openMusic(null,'lesson'));
$('#refresh').addEventListener('click',load);
$('#entry-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!ready&&!await load()){$('#form-error').textContent='Still unable to connect. Your form is saved here; try Save again when you are online.';return;}
  const button=event.submitter;button.disabled=true;$('#form-error').textContent='';
  const wasExisting=editingExisting;
  try{
    if(editingSubject==='music'){
      const entry={subject:'music',date:$('#entry-date').value,instrument:$('#entry-instrument').value,kind:$('#entry-kind').value,minutes:Number($('#entry-minutes').value),focus:$('#entry-focus').value,note:$('#entry-note').value};
      await mutate('save',editingId,entry);$('#entry-dialog').close();
      if(wasExisting) toast('Saved!'); else celebrateMusic(entry);
      return;
    }
    if(editingSubject==='english'){
      const status=$('#entry-status').value;
      const entry={subject:'english',date:$('#entry-date').value,level:5,lesson:status==='skipped'?null:Number($('#entry-lesson').value),status,progress:status==='complete'?1:status==='partial'?Number($('#entry-progress').value):0,reason:$('#entry-reason').value,note:$('#entry-note').value};
      const before=englishSummary, wasDone=status==='complete'&&before.progress[entry.lesson-1]===1;
      if(status==='complete'&&!wasDone) justEarned={subject:'english',lessons:[entry.lesson]};
      await mutate('save',editingId,entry);$('#entry-dialog').close();
      if(status==='complete'&&!wasDone&&englishSummary.progress[entry.lesson-1]===1) celebrateEnglish([entry.lesson],before);
      else toast(status==='complete'?'Saved! Nice work.':status==='partial'?englishCopy.partialMessage():englishCopy.breakMessage());
      return;
    }
    const status=$('#entry-status').value;
    const entry={subject:'math',date:$('#entry-date').value,book:Number($('#entry-book').value),lesson:status==='skipped'?null:Number($('#entry-lesson').value),status,progress:status==='complete'?1:status==='partial'?Number($('#entry-progress').value):0,reason:$('#entry-reason').value,note:$('#entry-note').value};
    const before=summary, wasDone=status==='complete'&&before.progress[entry.book][entry.lesson-1]===1;
    if(status==='complete'&&!wasDone) justEarned={subject:'math',book:entry.book,lessons:[entry.lesson]};
    await mutate('save',editingId,entry);$('#entry-dialog').close();
    if(status==='complete'&&!wasDone&&summary.progress[entry.book][entry.lesson-1]===1) celebrateLessons(entry.book,[entry.lesson],before);
    else toast(status==='complete'?'Saved! Nice work.':status==='partial'?mathCopy.partialMessage():mathCopy.breakMessage());
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
      const lesson=Number(box.value);justEarned={subject:'math',book:5,lessons:[...saved,lesson]};
      await mutate('save',crypto.randomUUID(),{subject:'math',date:today(),book:5,lesson,status:'complete',progress:1,reason:'',note:''});
      saved.push(lesson);box.checked=false;box.disabled=true;
    }
    $('#catchup-dialog').close();celebrateLessons(5,saved,before);
  }catch(error){$('#catchup-error').textContent=error.message+' Any already-saved lessons are unchecked.';}finally{event.target.disabled=false;}
});
$('#export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),baseline:{date:BASE_DATE,math5Finished:68,english:{date:ENGLISH_BASE,level:5,finished:22,lessons:120,target:ENGLISH_TARGET}},...state},null,2)],{type:'application/json'});
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
    if(subject==='music'){celebrate({sticker:'♪',title:'This is what practice looks like!',message:'Log a practice to earn the real thing.',mascot:MASCOT.music});return;}
    if(subject==='english'){
      const pct=englishSummary?percentOfTotal(englishSummary.total):18;
      celebrate({sticker:englishSummary?.nextLesson||23,title:'This is what finishing looks like!',message:'Finish a lesson to earn the real thing.',label:'English 5',percent:pct,count:englishSummary?`${englishSummary.progress.filter(part=>part===1).length} of 120 lessons`:'',mascot:MASCOT.english});
      return;
    }
    const book=summary?.active||5;
    celebrate({sticker:summary?.nextLesson||75,title:'This is what finishing looks like!',message:'Finish a lesson to earn the real thing.',label:`Math ${book}`,percent:summary?percentOf(summary,book):57,count:summary?`${finishedIn(summary,book)} of 120 lessons`:'',mascot:MASCOT.math});
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',syncThemeColor);
  syncThemeColor();
}

$('#entry-instrument').innerHTML=INSTRUMENTS.map(item=>`<option value="${item.id}">${item.name}</option>`).join('');
initCelebration();initTweaks();
window.addEventListener('online',()=>{if(!document.querySelector('dialog[open]'))load();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!document.querySelector('dialog[open]'))load();});
load();
