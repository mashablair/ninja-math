import {test} from 'vitest';
import assert from 'node:assert/strict';
import {materialize,type StoredEvent} from '../src/domain/events.ts';
import {validate} from '../src/domain/validate.ts';
import {summarizeCourse} from '../src/domain/subjects/course.ts';
import {summarizePractice,badgesFor,earnedBadges,songBank as bankFor,songsFor} from '../src/domain/subjects/practice.ts';
import {MATH,MUSIC} from '../src/domain/student.ts';
const summarize=(entries:any[],asOf:string)=>summarizePractice(MUSIC,entries,asOf);
const summarizeMath=(entries:any[],asOf:string)=>summarizeCourse(MATH,entries,asOf);
const songBank=(entries:any[])=>bankFor(MUSIC,entries);
const entry=(instrument,minutes,kind='practice',date='2026-11-04',seq=1):any=>({subject:'music',instrument,kind,minutes,date,seq,focus:'Long tones',note:''});

test('music minutes add up per instrument for the current week, with lessons counted',()=>{
  const s=summarize([entry('piano',20,'practice','2026-11-04',1),entry('piano',30,'lesson','2026-11-04',2),entry('flute',15,'practice','2026-11-03',3)],'2026-11-04');
  assert.deepEqual(s.week,{days:2,minutes:65,activities:[{item:'piano',minutes:50,days:1},{item:'flute',minutes:15,days:1}]});
  assert.equal(s.lessons.length,1);assert.equal(s.loggedToday,true);
});
test('a later week does not keep the earlier minutes',()=>{
  const s=summarize([entry('piano',20)],'2026-11-09');
  assert.deepEqual(s.week,{days:0,minutes:0,activities:[]});assert.equal(s.loggedToday,false);assert.equal(s.entries.length,1);
});
test('music badges: a first day per instrument, all three in one week, and each month with music',()=>{
  const earned=(logs:any[])=>Object.fromEntries(earnedBadges(badgesFor(MUSIC,logs)).map(b=>[b.id,b.earned]));
  // Her real start: a saxophone lesson, then piano and saxophone practice.
  const logs=[entry('saxophone',30,'lesson','2026-11-03',1),entry('piano',5,'practice','2026-11-05',2),entry('saxophone',7,'practice','2026-11-05',3)];
  assert.deepEqual(earned(logs),{'first-saxophone':'2026-11-03','first-piano':'2026-11-05','month-2026-11':'2026-11-03'});
  const flute=[...logs,entry('flute',10,'practice','2026-11-06',4)];
  assert.equal(earned(flute).mix,'2026-11-06');assert.equal(earned(flute).all,'2026-11-06');
  // The next week starts fresh: three instruments across two weeks earn the whole band, not triple play.
  const spread=[entry('piano',5,'practice','2026-11-06',1),entry('saxophone',5,'practice','2026-11-09',2),entry('flute',5,'practice','2026-11-10',3)];
  assert.equal(earned(spread).mix,undefined);assert.equal(earned(spread).all,'2026-11-10');
});
test('music check-ins do not change math',()=>{
  const s=summarizeMath([entry('piano',20)],'2026-11-04');
  assert.equal(s.books[5]!.total,68);assert.equal(s.loggedToday,false);
});
test('music validation keeps the practice log small and specific',()=>{
  const saved=validate({subject:'music',date:'2026-11-04',instrument:'saxophone',kind:'lesson',minutes:25,focus:'  Long tones  ',note:' Bring the book '});
  assert.deepEqual(saved,{v:1,subject:'music',date:'2026-11-04',instrument:'saxophone',kind:'lesson',minutes:25,songs:[],focus:'Long tones',note:'Bring the book'});
  assert.throws(()=>validate(entry('drums',10)),/Choose/);
  assert.throws(()=>validate(entry('piano',0)),/Choose/);
  assert.throws(()=>validate(entry('piano',181)),/Choose/);
  assert.throws(()=>validate({...entry('flute',10),focus:'   '}),/Choose a song or write/);
  assert.throws(()=>validate({...entry('flute',10),note:'x'.repeat(501)}),/Keep/);
});
test('a practice can be songs only, songs plus a note, but not empty',()=>{
  const songsOnly=validate({...entry('saxophone',20),focus:'',songs:['song-saxophone-ragtime','song-saxophone-ragtime','song-saxophone-satin-doll']});
  assert.deepEqual(songsOnly.songs,['song-saxophone-ragtime','song-saxophone-satin-doll']);
  assert.equal(songsOnly.focus,'');
  assert.throws(()=>validate({...entry('saxophone',20),focus:'',songs:[]}),/Choose a song or write/);
  assert.throws(()=>validate({...entry('saxophone',20),songs:['bad id!']}),/Choose the songs/);
  assert.throws(()=>validate({...entry('saxophone',20),songs:'song-saxophone-ragtime'}),/Choose the songs/);
});
test('songs are checked before they are saved',()=>{
  assert.deepEqual(validate({subject:'song',instrument:'flute',title:'  Greensleeves ',archived:false}),{v:1,subject:'song',instrument:'flute',title:'Greensleeves',archived:false});
  assert.throws(()=>validate({subject:'song',instrument:'drums',title:'Solo',archived:false}),/Choose/);
  assert.throws(()=>validate({subject:'song',instrument:'flute',title:'   ',archived:false}),/Choose a song name/);
  assert.throws(()=>validate({subject:'song',instrument:'flute',title:'x'.repeat(61),archived:false}),/Choose a song name/);
  assert.throws(()=>validate({subject:'song',instrument:'flute',title:'Solo'}),/archived/);
});
test('saxophone starts with its songs, and archiving or adding updates the bank',()=>{
  const start=songsFor(songBank([]),'saxophone');
  assert.deepEqual(start.map(song=>song.title),['In the Mood','Ragtime','Satin Doll']);
  assert.equal(songsFor(songBank([]),'piano').length,0);
  const events:StoredEvent[]=[
    {seq:1,entry_id:'song-saxophone-ragtime',operation:'save',payload:JSON.stringify({subject:'song',instrument:'saxophone',title:'Ragtime',archived:true})},
    {seq:2,entry_id:'song-1234abcd',operation:'save',payload:JSON.stringify({subject:'song',instrument:'flute',title:'Greensleeves',archived:false})},
    {seq:3,entry_id:'practice-1',operation:'save',payload:JSON.stringify({subject:'music',date:'2026-11-05',instrument:'flute',kind:'practice',minutes:10,songs:['song-1234abcd'],focus:'',note:''})}
  ];
  const entries=materialize(events), bank=songBank(entries);
  assert.equal(bank.find(song=>song.id==='song-saxophone-ragtime').archived,true);
  assert.equal(songsFor(bank,'flute')[0].title,'Greensleeves');
  assert.deepEqual(summarize(entries,'2026-11-05').week.activities,[{item:'flute',minutes:10,days:1}]);
  assert.equal(summarizeMath(entries,'2026-11-05').books[5]!.total,68);
});
