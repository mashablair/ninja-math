import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,sportsCalendar,ACTIVITIES,MAX_SPORT_MINUTES} from '../public/sports.js';
import {summarize as summarizeMusic} from '../public/music.js';
import {summarize as summarizeMath} from '../public/math.js';
import {validate} from '../src/worker.js';
const entry=(activity,minutes,date='2026-11-04',seq=1)=>({subject:'sports',activity,minutes,date,seq,focus:'',note:''});

test('sports minutes add up per activity for the current week',()=>{
  const s=summarize([entry('running',20,'2026-11-04',1),entry('running',15,'2026-11-05',2),entry('gym',45,'2026-11-02',3),entry('snorkeling',60,'2026-11-01',4)],'2026-11-05');
  assert.equal(s.minutes.running,35);assert.equal(s.minutes.gym,45);assert.equal(s.minutes.snorkeling,0);
  assert.equal(s.loggedToday,true);
  assert.deepEqual(Object.keys(s.minutes),ACTIVITIES.map(item=>item.id));
});
test('sports calendar keeps each activity separate and has no lesson days',()=>{
  const logs=[entry('mountain-biking',30,'2026-11-04',1),entry('mountain-biking',20,'2026-11-04',2),entry('running',10,'2026-11-04',3)];
  const cal=sportsCalendar(logs,'mountain-biking','2026-11-06');
  const day=cal.weeks.flat().find(cell=>cell.date==='2026-11-04');
  assert.equal(day.minutes,50);assert.equal(day.level,4);assert.equal(day.lesson,false);
  assert.equal(cal.days,1);
  assert.equal(sportsCalendar(logs,'water-skiing','2026-11-06').days,0);
});
test('sports do not change math or music',()=>{
  const logs=[entry('gym',30)];
  assert.equal(summarizeMath(logs,'2026-11-04').totals[5],68);
  assert.equal(summarizeMath(logs,'2026-11-04').loggedToday,false);
  assert.equal(summarizeMusic(logs,'2026-11-04').loggedToday,false);
});
test('sports validation keeps the log small and specific',()=>{
  assert.deepEqual(validate({...entry('water-skiing',40),focus:'  Got up on the first try ',note:''}),{subject:'sports',date:'2026-11-04',activity:'water-skiing',minutes:40,focus:'Got up on the first try',note:''});
  assert.throws(()=>validate(entry('golf',30)),/Choose one of the sports/);
  assert.throws(()=>validate(entry('gym',0)),/minutes/);
  assert.throws(()=>validate(entry('gym',MAX_SPORT_MINUTES+1)),/minutes/);
  assert.throws(()=>validate(entry('gym',12.5)),/minutes/);
  assert.throws(()=>validate({...entry('gym',30),focus:'x'.repeat(201)}),/under 200/);
  assert.throws(()=>validate({...entry('gym',30),date:'2026-10-01'}),/./);
});
