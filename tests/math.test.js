import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,finishDate,nextSchoolDay,materialize} from '../public/math.js';
import {validate} from '../src/worker.js';
const entry=(lesson,date='2026-11-03',progress=1,book=5,seq=lesson)=>({lesson,date,progress,book,seq,status:progress===1?'complete':'partial',note:'',reason:''});
const caughtUp=()=>Array.from({length:6},(_,i)=>entry(i+69));
test('original plan counts the first study date inclusively',()=>{
  assert.equal(finishDate('2027-01-07',120),'2027-06-23');
  const s=summarize(caughtUp(),'2026-11-03');
  assert.equal(s.math5,'2027-01-06');assert.equal(s.math6Start,'2027-01-07');assert.equal(s.math6,'2027-06-23');
});
test('unconfirmed catch-up work is not silently marked complete',()=>{
  const s=summarize([],'2026-11-03');assert.equal(s.totals[5],68);assert.deepEqual(s.backlog,[69,70,71,72,73,74]);assert.equal(s.nextLesson,75);
});
test('a skipped weekday delays both books; an unlogged past day is not invented',()=>{
  const entries=caughtUp();const skipped={date:'2026-11-04',status:'skipped',book:5,progress:0,seq:100};
  const s=summarize([...entries,skipped],'2026-11-04');assert.equal(s.math5,'2027-01-07');assert.equal(s.math6,'2027-06-24');
  assert.equal(summarize(entries,'2026-11-05').math5,'2027-01-07');assert.equal(entries.length,6);
});
test('partial work is cumulative, not additive, across days',()=>{
  const s=summarize([...caughtUp(),entry(75,'2026-11-04',0.5),entry(75,'2026-11-05',0.75)],'2026-11-05');
  assert.equal(s.totals[5],74.75);assert.equal(s.nextLesson,75);
  const complete=summarize([...caughtUp(),entry(75,'2026-11-04',0.5),entry(75,'2026-11-05',1)],'2026-11-05');assert.equal(complete.totals[5],75);
});
test('weekend effort counts and next book waits until a weekday',()=>{
  const entries=[...caughtUp(),entry(75,'2026-11-04'),entry(76,'2026-11-05'),entry(77,'2026-11-06')];
  const before=summarize(entries,'2026-11-07');const after=summarize([...entries,entry(78,'2026-11-07')],'2026-11-07');assert.ok(after.math6<before.math6);assert.equal(nextSchoolDay('2027-01-08'),'2027-01-11');
});
test('finished books keep their real finish date as time passes',()=>{
  const entries=Array.from({length:52},(_,i)=>entry(i+69,'2026-11-06'));
  const s=summarize([...entries,entry(120,'2026-11-09',1,5,200)],'2026-11-10');assert.equal(s.math5,'2026-11-06');assert.equal(s.math6Start,'2026-11-09');assert.equal(s.active,6);
});
test('edits and removals materialize correctly without erasing audit events',()=>{
  const events=[{seq:1,entry_id:'entry-one',operation:'save',payload:JSON.stringify(entry(75))},{seq:2,entry_id:'entry-one',operation:'save',payload:JSON.stringify(entry(75,'2026-11-03',0.5))}];
  assert.equal(materialize(events)[0].progress,0.5);events.push({seq:3,entry_id:'entry-one',operation:'remove',payload:'{}'});assert.deepEqual(materialize(events),[]);assert.equal(events.length,3);
});
test('bad lesson numbers, impossible dates and oversized notes are rejected',()=>{
  assert.throws(()=>validate(entry(121)),/Choose/);assert.throws(()=>validate(entry(1,'2026-02-30')),/Choose/);assert.throws(()=>validate({...entry(75),note:'x'.repeat(501)}),/Keep/);assert.throws(()=>validate(entry(75,'2099-01-01')),/Choose/);
  assert.equal(validate(entry(75)).subject,'math');
});
