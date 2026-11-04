import test from 'node:test';
import assert from 'node:assert/strict';
import {finishDate} from '../public/schedule.js';
import {summarize,TARGET,BASE_DATE} from '../public/english.js';
import {summarize as summarizeMath} from '../public/math.js';
import {validate} from '../src/worker.js';
const entry=(lesson,date='2026-11-04',progress=1,seq=lesson)=>({subject:'english',lesson,date,progress,seq,status:progress===1?'complete':'partial',note:'',reason:''});

test('english target is 98 weekdays from the november 4 baseline',()=>{
  assert.equal(BASE_DATE,'2026-11-04');
  assert.equal(finishDate('2026-11-04',98),TARGET);
  assert.equal(TARGET,'2027-03-19');
  const start=summarize([],'2026-11-04');
  assert.equal(start.total,22);
  assert.equal(start.nextLesson,23);
  assert.equal(start.finish,TARGET);
  assert.equal(start.loggedToday,false);
});
test('finishing lesson 23 on the start day keeps the original target',()=>{
  const s=summarize([entry(23)],'2026-11-04');
  assert.equal(s.total,23);assert.equal(s.nextLesson,24);assert.equal(s.finish,TARGET);assert.equal(s.loggedToday,true);
});
test('a skipped english day moves the forecast and an unlogged day is not invented',()=>{
  const skipped=summarize([{subject:'english',date:'2026-11-04',status:'skipped',progress:0,lesson:null,seq:1,note:'',reason:''}],'2026-11-04');
  assert.equal(skipped.total,22);assert.equal(skipped.finish,finishDate('2026-11-05',98));
  assert.equal(summarize([],'2026-11-05').finish,finishDate('2026-11-05',98));
});
test('english partial work is cumulative',()=>{
  const s=summarize([entry(23,'2026-11-04',0.5),entry(23,'2026-11-05',0.75,2)],'2026-11-05');
  assert.equal(s.total,22.75);assert.equal(s.nextLesson,23);
});
test('english check-ins do not change math',()=>{
  const s=summarizeMath([entry(23)],'2026-11-04');
  assert.equal(s.totals[5],68);assert.equal(s.loggedToday,false);assert.equal(s.nextLesson,75);
});
test('english validation accepts one level and rejects a date before the baseline',()=>{
  assert.equal(validate(entry(23)).subject,'english');
  assert.equal(validate(entry(23)).level,5);
  assert.throws(()=>validate(entry(121)),/Choose/);
  assert.throws(()=>validate(entry(23,'2026-11-03')),/November 4/);
  assert.throws(()=>validate({...entry(23),progress:0.5,status:'complete'}),/Choose/);
});
