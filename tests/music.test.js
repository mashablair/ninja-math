import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize} from '../public/music.js';
import {summarize as summarizeMath} from '../public/math.js';
import {validate} from '../src/worker.js';
const entry=(instrument,minutes,kind='practice',date='2026-11-04',seq=1)=>({subject:'music',instrument,kind,minutes,date,seq,focus:'Long tones',note:''});

test('music minutes add up per instrument for the current week',()=>{
  const s=summarize([entry('piano',20,'practice','2026-11-04',1),entry('piano',30,'lesson','2026-11-04',2),entry('flute',15,'practice','2026-11-03',3)],'2026-11-04');
  assert.equal(s.minutes.piano,50);assert.equal(s.minutes.flute,15);assert.equal(s.minutes.saxophone,0);
  assert.equal(s.lessons.length,1);assert.equal(s.loggedToday,true);
});
test('a later week does not keep the earlier minutes',()=>{
  const s=summarize([entry('piano',20)],'2026-11-09');
  assert.equal(s.minutes.piano,0);assert.equal(s.loggedToday,false);assert.equal(s.entries.length,1);
});
test('music check-ins do not change math',()=>{
  const s=summarizeMath([entry('piano',20)],'2026-11-04');
  assert.equal(s.totals[5],68);assert.equal(s.loggedToday,false);
});
test('music validation keeps the practice log small and specific',()=>{
  const saved=validate({subject:'music',date:'2026-11-04',instrument:'saxophone',kind:'lesson',minutes:25,focus:'  Long tones  ',note:' Bring the book '});
  assert.deepEqual(saved,{subject:'music',date:'2026-11-04',instrument:'saxophone',kind:'lesson',minutes:25,focus:'Long tones',note:'Bring the book'});
  assert.throws(()=>validate(entry('drums',10)),/Choose/);
  assert.throws(()=>validate(entry('piano',0)),/Choose/);
  assert.throws(()=>validate(entry('piano',181)),/Choose/);
  assert.throws(()=>validate({...entry('flute',10),focus:'   '}),/Choose/);
  assert.throws(()=>validate({...entry('flute',10),note:'x'.repeat(501)}),/Keep/);
});
