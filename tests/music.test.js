import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,practiceCalendar,level,CALENDAR_WEEKS,songBank,songsFor} from '../public/music.js';
import {summarize as summarizeMath,materialize} from '../public/math.js';
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
test('practice calendar is a year of Sunday-first weeks ending this week',()=>{
  const cal=practiceCalendar([],'piano','2026-11-06');
  assert.equal(cal.weeks.length,CALENDAR_WEEKS);
  assert.ok(cal.weeks.every(week=>week.length===7));
  assert.equal(new Date(cal.weeks[0][0].date+'T12:00:00Z').getUTCDay(),0);
  const last=cal.weeks.at(-1);
  assert.equal(last[0].date,'2026-11-01');assert.equal(last[5].date,'2026-11-06');
  assert.equal(last[5].future,false);assert.equal(last[6].future,true);
  assert.equal(cal.days,0);
  assert.equal(cal.months.filter(Boolean).at(-1),'2026-11');
});
test('practice calendar adds minutes per day and instrument, and marks lesson days',()=>{
  const cal=practiceCalendar([
    entry('piano',10,'practice','2026-11-04',1),entry('piano',25,'lesson','2026-11-04',2),
    entry('piano',5,'practice','2026-11-03',3),entry('flute',60,'practice','2026-11-04',4),
    entry('piano',20,'practice','2026-11-07',5)
  ],'piano','2026-11-06');
  const days=Object.fromEntries(cal.weeks.flat().map(day=>[day.date,day]));
  assert.equal(days['2026-11-04'].minutes,35);assert.equal(days['2026-11-04'].lesson,true);assert.equal(days['2026-11-04'].level,3);
  assert.equal(days['2026-11-03'].minutes,5);assert.equal(days['2026-11-03'].lesson,false);assert.equal(days['2026-11-03'].level,1);
  assert.equal(days['2026-11-05'].level,0);
  assert.equal(days['2026-11-07'].entries.length,0);
  assert.equal(cal.days,2);
});
test('practice shades use fixed minute steps',()=>{
  assert.deepEqual([0,1,14,15,29,30,44,45,180].map(level),[0,1,1,2,2,3,3,4,4]);
});
test('music check-ins do not change math',()=>{
  const s=summarizeMath([entry('piano',20)],'2026-11-04');
  assert.equal(s.totals[5],68);assert.equal(s.loggedToday,false);
});
test('music validation keeps the practice log small and specific',()=>{
  const saved=validate({subject:'music',date:'2026-11-04',instrument:'saxophone',kind:'lesson',minutes:25,focus:'  Long tones  ',note:' Bring the book '});
  assert.deepEqual(saved,{subject:'music',date:'2026-11-04',instrument:'saxophone',kind:'lesson',minutes:25,songs:[],focus:'Long tones',note:'Bring the book'});
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
  assert.deepEqual(validate({subject:'song',instrument:'flute',title:'  Greensleeves ',archived:false}),{subject:'song',instrument:'flute',title:'Greensleeves',archived:false});
  assert.throws(()=>validate({subject:'song',instrument:'drums',title:'Solo',archived:false}),/Choose/);
  assert.throws(()=>validate({subject:'song',instrument:'flute',title:'   ',archived:false}),/Choose a song name/);
  assert.throws(()=>validate({subject:'song',instrument:'flute',title:'x'.repeat(61),archived:false}),/Choose a song name/);
  assert.throws(()=>validate({subject:'song',instrument:'flute',title:'Solo'}),/archived/);
});
test('saxophone starts with its songs, and archiving or adding updates the bank',()=>{
  const start=songsFor(songBank([]),'saxophone');
  assert.deepEqual(start.map(song=>song.title),['In the Mood','Ragtime','Satin Doll']);
  assert.equal(songsFor(songBank([]),'piano').length,0);
  const events=[
    {seq:1,entry_id:'song-saxophone-ragtime',operation:'save',payload:JSON.stringify({subject:'song',instrument:'saxophone',title:'Ragtime',archived:true})},
    {seq:2,entry_id:'song-1234abcd',operation:'save',payload:JSON.stringify({subject:'song',instrument:'flute',title:'Greensleeves',archived:false})},
    {seq:3,entry_id:'practice-1',operation:'save',payload:JSON.stringify({subject:'music',date:'2026-11-05',instrument:'flute',kind:'practice',minutes:10,songs:['song-1234abcd'],focus:'',note:''})}
  ];
  const entries=materialize(events), bank=songBank(entries);
  assert.equal(bank.find(song=>song.id==='song-saxophone-ragtime').archived,true);
  assert.equal(songsFor(bank,'flute')[0].title,'Greensleeves');
  assert.equal(summarize(entries,'2026-11-05').minutes.flute,10);
  assert.equal(summarizeMath(entries,'2026-11-05').totals[5],68);
});
