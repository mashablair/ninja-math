import {test} from 'vitest';
import assert from 'node:assert/strict';
import {summarizeCourse,completions,lessonsLeft,unitOf} from '../src/domain/subjects/course.ts';
import {summarizeLeague} from '../src/domain/league.ts';
import {validate} from '../src/domain/validate.ts';
import {MATH,ENGLISH,NINJA} from '../src/domain/student.ts';
let seq=0;
const math=(lesson:number,date:string,status='complete'):any=>({subject:'math',date,book:5,lesson,status,progress:status==='complete'?1:0.5,seq:++seq,note:'',reason:''});
const english=(lesson:number,date:string):any=>({subject:'english',date,level:5,lesson,status:'complete',progress:1,seq:++seq,note:'',reason:''});
const weekOff=(week:string):any=>({subject:'weekoff',week,seq:++seq});
const checked=(lesson:number,date:string,of='math'):any=>({subject:'checked',of,book:5,lesson,date,seq:++seq});
// n lessons of each subject from Monday on, one a day.
function week(monday:string,mathCount:number,englishCount:number,from={math:76,english:23}):any[] {
  const day=(i:number)=>new Date(Date.parse(monday+'T12:00:00Z')+i%7*86400000).toISOString().slice(0,10);
  return [...Array.from({length:mathCount},(_,i)=>math(from.math+i,day(i))),...Array.from({length:englishCount},(_,i)=>english(from.english+i,day(i)))];
}
const league=(entries:any[],asOf:string)=>summarizeLeague(NINJA,entries,asOf)!;

test('Math 5 has four units of 30, and belts count on in order',()=>{
  const s=summarizeCourse(MATH,[],'2026-11-10');
  const math5=s.units.filter(u=>u.book===5);
  assert.deepEqual(math5.map(u=>[u.first,u.last,u.belt]),[[1,30,0],[31,60,1],[61,90,2],[91,120,3]]);
  // Lessons 1–68 were done before check-ins: two belts earned, with no day to show.
  assert.deepEqual(math5.map(u=>u.earned),[true,true,false,false]);
  assert.equal(s.units[0]!.earnedOn,null);
  assert.equal(s.unit!.number,3);assert.equal(s.unit!.finished,8);
  assert.equal(unitOf(s,5,90)!.number,3);assert.equal(unitOf(s,6,1)!.belt,4);
  assert.equal(MATH.books[0]!.titles![75],'Time Review');
});
test('a belt is earned when every lesson in the unit is finished and checked, on the last day either happened',()=>{
  const unit3=[...[69,70,71,72,73,74].map(n=>math(n,'2026-11-10')),...Array.from({length:14},(_,i)=>math(75+i,'2026-11-20'))];
  const finished=[...unit3,math(89,'2026-12-01'),math(90,'2026-12-02')];
  // Lessons 1–76 were checked before checks were logged; 77–90 still need Mom.
  const waiting=summarizeCourse(MATH,finished,'2026-12-03');
  assert.equal(waiting.units[2]!.earned,false);assert.equal(waiting.units[2]!.finished,30);assert.equal(waiting.units[2]!.checked,16);
  const all=[...finished,...Array.from({length:14},(_,i)=>checked(77+i,'2026-12-03'))];
  const s=summarizeCourse(MATH,all,'2026-12-03');
  assert.equal(s.units[2]!.earned,true);assert.equal(s.units[2]!.earnedOn,'2026-12-03');
  assert.equal(summarizeCourse(MATH,all.filter(e=>!(e.subject==='checked'&&e.lesson===90)),'2026-12-03').units[2]!.earned,false);
  // The assessment alone doesn't earn it, and neither does everything but a half-done assessment.
  assert.equal(summarizeCourse(MATH,[math(89,'2026-12-01'),math(90,'2026-12-02')],'2026-12-03').units[2]!.earned,false);
  assert.equal(summarizeCourse(MATH,[...unit3,math(89,'2026-12-01'),math(90,'2026-12-02','partial')],'2026-12-03').units[2]!.earned,false);
});
test('only lessons finished during check-ins count toward the league, once each',()=>{
  const done=completions(MATH,[math(60,'2026-11-09'),math(70,'2026-11-09'),math(76,'2026-11-10','partial'),math(76,'2026-11-11'),math(76,'2026-11-12')]);
  assert.deepEqual(done.map(c=>[c.lesson,c.date]),[[76,'2026-11-11']]);
});
test('a league week: 5 + 5 moves up, close stays, under that moves down one',()=>{
  assert.deepEqual(league([],'2026-11-10'),{league:0,goal:10,stay:6,week:{monday:'2026-11-09',lessons:{math:0,english:0},points:0,off:false,league:0,result:null},history:[],last:null});
  const up=week('2026-11-09',5,5);
  assert.equal(league(up,'2026-11-15').week.points,10);
  assert.equal(league(up,'2026-11-16').league,1);assert.equal(league(up,'2026-11-16').last!.result,'up');
  // Extra Math doesn't make up for missing English: 7 + 2 is 7 points, enough to stay.
  const stay=[...up,...week('2026-11-16',7,2,{math:81,english:28})];
  assert.equal(league(stay,'2026-11-23').history[0]!.points,7);assert.equal(league(stay,'2026-11-23').league,1);
  const down=[...stay,...week('2026-11-23',2,3,{math:88,english:30})];
  assert.equal(league(down,'2026-11-30').last!.result,'down');assert.equal(league(down,'2026-11-30').league,0);
});
test('the first league is the floor, and a week off counts neither way',()=>{
  assert.equal(league([],'2026-11-30').league,0);
  assert.deepEqual(league([],'2026-11-30').history.map(w=>w.result),['stay','stay','stay']);
  const off=[...week('2026-11-09',5,5),weekOff('2026-11-16')];
  assert.equal(league(off,'2026-11-23').last!.result,'off');assert.equal(league(off,'2026-11-23').league,1);
});
test('the top league stays the top',()=>{
  let entries:any[]=[], m=76, e=23;
  for(let i=0;i<10;i++){const monday=new Date(Date.parse('2026-11-09T12:00:00Z')+i*7*86400000).toISOString().slice(0,10);entries=[...entries,...week(monday,5,5,{math:m,english:e})];m+=5;e+=5;}
  assert.equal(league(entries,'2027-01-18').league,8);
  assert.equal(league(entries,'2027-01-18').last!.result,'stay');
});
test('a week off is a Monday from the league start through this week',()=>{
  assert.deepEqual(validate({subject:'weekoff',week:'2026-11-09'}),{v:1,subject:'weekoff',week:'2026-11-09'});
  assert.throws(()=>validate({subject:'weekoff',week:'2026-11-10'}),/Choose a week/);
  assert.throws(()=>validate({subject:'weekoff',week:'2026-11-02'}),/Choose a week/);
  assert.throws(()=>validate({subject:'weekoff',week:'2099-01-05'}),/Choose a week/);
});
test('Math 6 belts pick up where Math 5 ends, blue through black',()=>{
  const s=summarizeCourse(MATH,[],'2026-11-10');
  assert.deepEqual(s.units.filter(u=>u.book===6).map(u=>[u.first,u.review,u.belt]),[[1,28,4],[31,58,5],[61,88,6],[91,118,7]]);
  assert.equal(MATH.books[1]!.titles![44],'Arches National Park Puzzles');
});
test('English 5 has six units with project lessons and no assessment; finishing the unit earns the belt',()=>{
  const s=summarizeCourse(ENGLISH,[],'2026-11-10');
  assert.deepEqual(s.units.map(u=>[u.first,u.last]),[[1,20],[21,43],[44,63],[64,83],[84,103],[104,120]]);
  assert.deepEqual(s.units.map(u=>u.earned),[true,false,false,false,false,false]);
  assert.equal(s.unit!.number,2);assert.equal(s.unit!.finished,2);
  assert.equal(lessonsLeft(s.unit!,s.books[5]!.progress),21);
  assert.equal(ENGLISH.books[0]!.titles![31],'Project Lesson');assert.equal(ENGLISH.books[0]!.titles![30],'');
  const done=Array.from({length:21},(_,i)=>english(23+i,'2026-11-20'));
  // 23–29 were checked before checks were logged; 30–43 need Mom's check.
  assert.equal(summarizeCourse(ENGLISH,done,'2026-11-21').units[1]!.earned,false);
  const checks=Array.from({length:14},(_,i)=>checked(30+i,'2026-11-21','english'));
  assert.equal(summarizeCourse(ENGLISH,[...done,...checks],'2026-11-21').units[1]!.earned,true);
});
