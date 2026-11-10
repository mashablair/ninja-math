import type {CourseSubject,PracticeSubject,Student,Subject} from './subjects/types.ts';
import {MATH5_TITLES,MATH5_UNITS} from './books/math5.ts';
import {MATH6_TITLES,MATH6_UNITS} from './books/math6.ts';
import {ENGLISH5_TITLES,ENGLISH5_UNITS} from './books/english5.ts';

// Ninja's subjects as settings. Adding a subject or an activity is a change here, not new code.
// Phase 4 moves this into the database behind the admin page.
export const MATH:CourseSubject={
  type:'course',id:'math',name:'Math',start:'2026-11-03',bookField:'book',askTopic:true,
  books:[
    {id:5,lessons:120,baseline:68,target:'2027-01-06',needsConfirmation:[69,70,71,72,73,74],plannedFrom:75,units:MATH5_UNITS,titles:MATH5_TITLES},
    {id:6,lessons:120,baseline:0,target:'2027-06-23',units:MATH6_UNITS,titles:MATH6_TITLES}
  ]
};
// 98 weekdays starting November 4, 2026, when lesson 23 was next.
export const ENGLISH:CourseSubject={
  type:'course',id:'english',name:'English',start:'2026-11-04',bookField:'level',
  books:[{id:5,lessons:120,baseline:22,target:'2027-03-19',units:ENGLISH5_UNITS,titles:ENGLISH5_TITLES}]
};
export const MUSIC:PracticeSubject={
  type:'practice',id:'music',name:'Music',start:'2026-11-03',itemField:'instrument',maxMinutes:180,
  items:[{id:'piano',name:'Piano'},{id:'flute',name:'Flute'},{id:'saxophone',name:'Saxophone'}],
  lessons:{minutes:30},
  songs:{maxTitle:60,maxPerLog:20,starting:[
    {id:'song-saxophone-ragtime',instrument:'saxophone',title:'Ragtime'},
    {id:'song-saxophone-in-the-mood',instrument:'saxophone',title:'In the Mood'},
    {id:'song-saxophone-satin-doll',instrument:'saxophone',title:'Satin Doll'}
  ]},
  labels:{items:'instruments',minutes:'practiced',focus:'what you practiced'},
  minuteChoices:[5,10,15,20,30],feel:true,goal:true,badges:{mix:3}
};
export const SPORTS:PracticeSubject={
  type:'practice',id:'sports',name:'Sports',start:'2026-11-03',itemField:'activity',maxMinutes:300,
  items:[
    {id:'gym',name:'Gym'},
    {id:'running',name:'Running'},
    {id:'mountain-biking',name:'Mountain biking'},
    {id:'snorkeling',name:'Snorkeling'},
    {id:'water-skiing',name:'Water skiing'}
  ],
  labels:{items:'sports',minutes:'moved',focus:'what you did'},
  minuteChoices:[15,30,45,60,90],other:{maxName:40},feel:true,goal:true,badges:{mix:3}
};
// Her goal is 5 Math and 5 English lessons a week. Leagues start fresh the week they arrived.
export const NINJA:Student={id:'ninja',name:'Ninja',timezone:'America/New_York',subjects:[MATH,ENGLISH,MUSIC,SPORTS],
  league:{start:'2026-11-09',subjects:['math','english'],perSubject:5,stay:6,tiers:9}};

export const subjectOf=(student:Student,id:unknown):Subject|undefined=>student.subjects.find(subject=>subject.id===id);
