import {test} from 'vitest';
import assert from 'node:assert/strict';
import {validate} from '../src/domain/validate.ts';
import {summarizeCourse} from '../src/domain/subjects/course.ts';
import {summarizePractice,practiceCalendar,totals,badgesFor,earnedBadges,goalOf} from '../src/domain/subjects/practice.ts';
import {monthCalendar} from '../src/domain/calendar.ts';
import {materialize} from '../src/domain/events.ts';
import {MATH,MUSIC,SPORTS} from '../src/domain/student.ts';
const summarize=(entries:any[],asOf:string)=>summarizePractice(SPORTS,entries,asOf);
const summarizeMusic=(entries:any[],asOf:string)=>summarizePractice(MUSIC,entries,asOf);
const summarizeMath=(entries:any[],asOf:string)=>summarizeCourse(MATH,entries,asOf);
const sportsCalendar=(entries:any[],item:string,asOf:string)=>practiceCalendar(SPORTS,entries,item,asOf);
const ACTIVITIES=SPORTS.items, MAX_SPORT_MINUTES=SPORTS.maxMinutes;
const entry=(activity,minutes,date='2026-11-04',seq=1):any=>({subject:'sports',activity,minutes,date,seq,focus:'',note:''});
const other=(name,minutes,date='2026-11-04',seq=1):any=>({...entry('other',minutes,date,seq),name});
const earned=(logs:any[])=>Object.fromEntries(earnedBadges(badgesFor(SPORTS,logs)).map(b=>[b.id,b.earned]));

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
  assert.equal(summarizeMath(logs,'2026-11-04').books[5]!.total,68);
  assert.equal(summarizeMath(logs,'2026-11-04').loggedToday,false);
  assert.equal(summarizeMusic(logs,'2026-11-04').loggedToday,false);
});
test('sports validation keeps the log small and specific',()=>{
  assert.deepEqual(validate({...entry('water-skiing',40),focus:'  Got up on the first try ',note:''}),{v:1,subject:'sports',date:'2026-11-04',activity:'water-skiing',minutes:40,focus:'Got up on the first try',note:''});
  assert.throws(()=>validate(entry('golf',30)),/Choose one of the sports/);
  assert.throws(()=>validate(entry('gym',0)),/minutes/);
  assert.throws(()=>validate(entry('gym',MAX_SPORT_MINUTES+1)),/minutes/);
  assert.throws(()=>validate(entry('gym',12.5)),/minutes/);
  assert.throws(()=>validate({...entry('gym',30),focus:'x'.repeat(201)}),/under 200/);
  assert.throws(()=>validate({...entry('gym',30),date:'2026-10-01'}),/./);
});

test('something else needs a name and keeps it; listed sports drop any name',()=>{
  assert.deepEqual(validate({...other('  Swimming ',30),feel:'amazing'}),{v:1,subject:'sports',date:'2026-11-04',activity:'other',name:'Swimming',minutes:30,feel:'amazing',focus:'',note:''});
  assert.throws(()=>validate(other('  ',30)),/Type what you did/);
  assert.throws(()=>validate(other('x'.repeat(41),30)),/Type what you did/);
  assert.equal('name' in validate({...entry('gym',30),name:'Lifting'}),false);
});
test('how it felt is optional and one of three faces',()=>{
  assert.equal('feel' in validate(entry('gym',30)),false);
  assert.equal(validate({...entry('gym',30),feel:'tough'}).feel,'tough');
  assert.throws(()=>validate({...entry('gym',30),feel:'meh'}),/tough, good, or amazing/);
  assert.equal('feel' in validate({subject:'music',instrument:'piano',kind:'practice',minutes:20,date:'2026-11-04',focus:'Scales',note:'',feel:'good'}),false);
});
test('a goal counts days, from 1 to 7, and only for subjects that offer one',()=>{
  assert.deepEqual(validate({subject:'goal',of:'sports',days:3}),{v:1,subject:'goal',of:'sports',days:3});
  assert.throws(()=>validate({subject:'goal',of:'sports',days:0}),/1 to 7/);
  assert.throws(()=>validate({subject:'goal',of:'sports',days:2.5}),/1 to 7/);
  assert.throws(()=>validate({subject:'goal',of:'music',days:3}),/valid subject/);
  const events=[
    {seq:1,entry_id:'goal-sports',operation:'save',payload:JSON.stringify({subject:'goal',of:'sports',days:3})},
    {seq:2,entry_id:'goal-sports',operation:'save',payload:JSON.stringify({subject:'goal',of:'sports',days:4})}
  ] as const;
  assert.equal(goalOf(SPORTS,materialize([...events])),4);
  assert.equal(goalOf(SPORTS,materialize([...events,{seq:3,entry_id:'goal-sports',operation:'remove',payload:'{}'}])),null);
  assert.equal(goalOf(MUSIC,materialize([...events])),null);
});
test('totals list only what she did, by sport, with each something else by name',()=>{
  const logs=[entry('running',30,'2026-11-09',1),entry('gym',35,'2026-11-05',2),other('Swimming',20,'2026-11-09',3),other('swimming',10,'2026-11-10',4),other('Dance',45,'2026-11-10',5),entry('gym',10,'2026-11-01',6)];
  const week=totals(SPORTS,logs,'2026-11-09','2026-11-15');
  assert.equal(week.days,2);assert.equal(week.minutes,105);
  assert.deepEqual(week.activities,[{item:'running',minutes:30,days:1},{item:'other',name:'Swimming',minutes:30,days:2},{item:'other',name:'Dance',minutes:45,days:1}]);
  assert.deepEqual(totals(SPORTS,[],'2026-11-09','2026-11-15'),{days:0,minutes:0,activities:[]});
  const s=summarize(logs,'2026-11-09');
  assert.equal(s.week.days,1);assert.equal(s.week.minutes,50);
});
test('the month calendar is Monday-first with blanks around the month',()=>{
  const weeks=monthCalendar([entry('running',30,'2026-11-09',1),entry('gym',15,'2026-11-09',2),entry('gym',20,'2026-12-01',3)],'2026-11','2026-11-09');
  assert.equal(weeks.length,6);
  assert.deepEqual(weeks[0].slice(0,6),[null,null,null,null,null,null]);
  assert.equal(weeks[0][6].date,'2026-11-01');
  const ninth=weeks[2][0];
  assert.equal(ninth.date,'2026-11-09');assert.equal(ninth.minutes,45);assert.equal(ninth.entries.length,2);assert.equal(ninth.future,false);
  assert.equal(weeks[2][1].future,true);
  assert.equal(weeks[5][0].date,'2026-11-30');assert.equal(weeks[5][1],null);
  assert.equal(weeks.flat().filter(Boolean).length,30);
});
test('badges come only from real logs, with the day each was earned',()=>{
  assert.deepEqual(earned([]),{});
  assert.equal(badgesFor(MUSIC,[entry('gym',30)]).length,0);
  const logs=[entry('gym',35,'2026-11-05',1),entry('mountain-biking',30,'2026-11-07',2),entry('running',30,'2026-11-09',3),entry('running',30,'2026-11-10',4)];
  assert.deepEqual(earned(logs),{'first-gym':'2026-11-05','first-mountain-biking':'2026-11-07','first-running':'2026-11-09','month-2026-11':'2026-11-05'});
  // Three different sports in one Monday–Sunday week: running, then gym, then dance on Thursday.
  const mixed=[...logs,entry('gym',20,'2026-11-11',5),other('Dance',30,'2026-11-12',6)];
  assert.equal(earned(logs).mix,undefined);
  assert.equal(earned(mixed).mix,'2026-11-12');
  assert.equal(earned(mixed)['first-other'],'2026-11-12');
  assert.equal(earned(mixed).all,undefined);
  const all=[...mixed,entry('snorkeling',40,'2026-12-20',7),entry('water-skiing',40,'2026-12-27',8)];
  assert.equal(earned(all).all,'2026-12-27');
  assert.equal(earned(all)['month-2026-12'],'2026-12-20');
  // Two different things she named herself count as two different sports.
  assert.equal(earned([other('Dance',30,'2026-11-09',1),other('Swimming',30,'2026-11-10',2),entry('gym',30,'2026-11-11',3)]).mix,'2026-11-11');
  assert.equal(earned([other('Dance',30,'2026-11-09',1),other('dance',30,'2026-11-10',2),entry('gym',30,'2026-11-11',3)]).mix,undefined);
});
