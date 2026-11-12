import {test} from 'vitest';
import assert from 'node:assert/strict';
import {materialize,checkedId,type StoredEvent} from '../src/domain/events.ts';
import {summarizeLeague} from '../src/domain/league.ts';
import {nudgeFor} from '../src/domain/nudge.ts';
import {validate} from '../src/domain/validate.ts';
import {summarizeCourse} from '../src/domain/subjects/course.ts';
import {MATH,ENGLISH,NINJA} from '../src/domain/student.ts';
let seq=0;
const math=(lesson:number,date:string,status='complete'):any=>({subject:'math',date,book:5,lesson,status,progress:status==='complete'?1:status==='partial'?0.5:0,seq:++seq,note:'',reason:'',topic:''});
const checked=(lesson:number,date:string,of='math',book=5):any=>({id:checkedId(of,book,lesson),subject:'checked',of,book,lesson,date,seq:++seq});
const caughtUp=()=>[69,70,71,72,73,74,75,76].map(n=>math(n,'2026-11-06'));

test('Mom’s checks before they were logged: Math 1–76 and English 1–29',()=>{
  const s=summarizeCourse(MATH,[...caughtUp(),math(77,'2026-11-11')],'2026-11-12');
  assert.equal(s.books[5]!.checked.filter(Boolean).length,76);
  assert.deepEqual(s.waiting,[{book:5,lesson:77,finishedOn:'2026-11-11',fixedOn:[]}]);
  // A checked lesson that isn't finished waits for nothing: 69–74 still need her confirmation first.
  assert.deepEqual(summarizeCourse(MATH,[],'2026-11-12').waiting,[]);
  assert.equal(summarizeCourse(ENGLISH,[],'2026-11-12').books[5]!.checked.filter(Boolean).length,29);
});
test('a check marks the lesson correct; removing it puts it back in the waiting list',()=>{
  const events:StoredEvent[]=[
    {seq:1,entry_id:'entry-77',operation:'save',payload:JSON.stringify(math(77,'2026-11-11'))},
    {seq:2,entry_id:checkedId('math',5,77),operation:'save',payload:JSON.stringify({subject:'checked',of:'math',book:5,lesson:77,date:'2026-11-12'})}
  ];
  const s=summarizeCourse(MATH,materialize(events),'2026-11-12');
  assert.equal(s.books[5]!.checked[76],true);assert.equal(s.books[5]!.checkedOn[76],'2026-11-12');assert.deepEqual(s.waiting,[]);
  events.push({seq:3,entry_id:checkedId('math',5,77),operation:'remove',payload:'{}'});
  assert.deepEqual(summarizeCourse(MATH,materialize(events),'2026-11-12').waiting.map(w=>w.lesson),[77]);
  // English checks don't touch Math.
  assert.equal(summarizeCourse(MATH,[math(77,'2026-11-11'),checked(77,'2026-11-12','english')],'2026-11-12').books[5]!.checked[76],false);
});
test('fixing mistakes is logged against the lesson without changing its progress or the plan',()=>{
  const finished=[...caughtUp(),math(77,'2026-11-11')];
  const before=summarizeCourse(MATH,finished,'2026-11-12'), after=summarizeCourse(MATH,[...finished,math(77,'2026-11-12','fixed')],'2026-11-12');
  assert.equal(after.books[5]!.progress[76],1);assert.equal(after.books[5]!.total,before.books[5]!.total);
  // A fix-up doesn't use up today's work slot, so the forecast stays where it was.
  assert.equal(after.loggedToday,false);assert.equal(after.books[5]!.finish,before.books[5]!.finish);assert.equal(after.nextLesson,78);
  assert.deepEqual(after.waiting[0]!.fixedOn,['2026-11-12']);
  // Fixing an unfinished lesson doesn't finish it either.
  assert.equal(summarizeCourse(MATH,[math(80,'2026-11-12','fixed')],'2026-11-12').books[5]!.progress[79],0);
});
test('fixing mistakes doesn’t count toward the league or quiet Sassy Ninja',()=>{
  const week=['2026-11-16','2026-11-17'].map((d,i)=>math(77+i,d));
  // Friday with two lessons is two behind; a fix-up today doesn't change that.
  const entries=[...week,math(77,'2026-11-20','fixed')];
  assert.equal(summarizeLeague(NINJA,entries,'2026-11-20')!.week.lessons.math,2);
  assert.deepEqual(nudgeFor(NINJA,MATH,entries,summarizeLeague(NINJA,entries,'2026-11-20'),'2026-11-20'),{kind:'behind',done:2,expected:4});
});
test('a fix-up names a lesson and saves no amount, topic, or reason',()=>{
  const saved=validate({subject:'math',date:'2026-11-12',book:5,lesson:77,status:'fixed',progress:1,topic:'Elapsed time',reason:'Needed help',note:''});
  assert.equal(saved.status,'fixed');assert.equal(saved.progress,0);assert.equal(saved.topic,'');assert.equal(saved.reason,'');
  assert.throws(()=>validate({subject:'math',date:'2026-11-12',book:5,lesson:121,status:'fixed',note:'',reason:''}),/Choose a lesson/);
  assert.equal(validate({subject:'english',date:'2026-11-12',level:5,lesson:30,status:'fixed',note:'',reason:''}).level,5);
});
test('a check names a real lesson of a course subject, on a day up to today',()=>{
  assert.deepEqual(validate({subject:'checked',of:'math',book:5,lesson:77,date:'2026-11-12'}),{v:1,subject:'checked',of:'math',book:5,lesson:77,date:'2026-11-12'});
  assert.equal(validate({subject:'checked',of:'math',book:6,lesson:1,date:'2026-11-12'}).book,6);
  assert.throws(()=>validate({subject:'checked',of:'math',book:7,lesson:1,date:'2026-11-12'}),/Choose a lesson/);
  assert.throws(()=>validate({subject:'checked',of:'english',book:5,lesson:121,date:'2026-11-12'}),/Choose a lesson/);
  assert.throws(()=>validate({subject:'checked',of:'music',book:5,lesson:1,date:'2026-11-12'}),/valid subject/);
  assert.throws(()=>validate({subject:'checked',of:'math',book:5,lesson:77,date:'2099-01-01'}),/Choose a real date/);
});
