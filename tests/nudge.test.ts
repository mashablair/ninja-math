import {test} from 'vitest';
import assert from 'node:assert/strict';
import {summarizeLeague} from '../src/domain/league.ts';
import {nudgeFor} from '../src/domain/nudge.ts';
import {MATH,ENGLISH,NINJA} from '../src/domain/student.ts';
let seq=0;
const math=(lesson:number,date:string,status='complete'):any=>({subject:'math',date,book:5,lesson,status,progress:status==='complete'?1:status==='partial'?0.5:0,seq:++seq});
const english=(lesson:number,date:string):any=>({subject:'english',date,level:5,lesson,status:'complete',progress:1,seq:++seq});
const nudge=(subject:any,entries:any[],asOf:string)=>nudgeFor(NINJA,subject,entries,summarizeLeague(NINJA,entries,asOf),asOf);
// One Math lesson a day, Monday through Friday of the week of Nov 16.
const steady=['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20'].map((d,i)=>math(76+i,d));

test('on pace, or checked in today, Ninja keeps it sweet',()=>{
  assert.equal(nudge(MATH,steady.slice(0,2),'2026-11-18'),null);
  assert.equal(nudge(MATH,[math(76,'2026-11-18')],'2026-11-18'),null);
  assert.equal(nudge(MATH,steady,'2026-11-21'),null);
});
test('two lessons behind the weekday pace gets sass',()=>{
  // Thursday with one lesson: three weekdays have passed.
  assert.deepEqual(nudge(MATH,[math(76,'2026-11-16')],'2026-11-19'),{kind:'behind',done:1,expected:3});
  assert.equal(nudge(MATH,[math(76,'2026-11-16'),math(77,'2026-11-17')],'2026-11-19'),null);
});
test('a lesson waiting a couple of weekdays gets sass, even on a Monday',()=>{
  // Last lesson Wednesday: Thursday and Friday went by.
  assert.deepEqual(nudge(MATH,[math(76,'2026-11-18')],'2026-11-23'),{kind:'waiting',since:'2026-11-19',days:2});
  // A break day isn't a lesson, so the wait goes on; one missed Friday is fine.
  assert.deepEqual(nudge(MATH,[math(76,'2026-11-18'),math(77,'2026-11-20','skipped')],'2026-11-23'),{kind:'waiting',since:'2026-11-19',days:2});
  assert.equal(nudge(MATH,[math(76,'2026-11-19')],'2026-11-23'),null);
});
test('the weekend before the goal is met gets sass',()=>{
  assert.deepEqual(nudge(MATH,steady.slice(0,3),'2026-11-21'),{kind:'weekend',done:3,left:2,days:2});
  assert.deepEqual(nudge(MATH,steady.slice(0,3),'2026-11-22'),{kind:'weekend',done:3,left:2,days:1});
});
test('one subject far behind the other gets sass',()=>{
  // Wednesday: four Math lessons, one English. English is on pace, just lopsided.
  const entries=[math(76,'2026-11-16'),math(77,'2026-11-16'),math(78,'2026-11-17'),math(79,'2026-11-17'),english(23,'2026-11-17')];
  assert.deepEqual(nudge(ENGLISH,entries,'2026-11-18'),{kind:'lopsided',done:1,other:'math',otherDone:4});
  assert.equal(nudge(MATH,entries,'2026-11-18'),null);
});
test('a week Mom marked off has no sass at all',()=>{
  assert.equal(nudge(MATH,[{subject:'weekoff',week:'2026-11-16',seq:++seq}],'2026-11-19'),null);
});
