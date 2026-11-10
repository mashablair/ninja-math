import type {Day} from '../dates.ts';

export interface Item {id:string;name:string}
// A unit of lessons first–last. It may have a review lesson, project lessons, and an assessment at the end; finishing all of it earns its belt.
export interface Unit {first:number;last:number;review?:number;test?:number[];projects?:number[]}
export interface Book {
  id:number;
  lessons:number;
  // Lessons 1..baseline were finished before check-ins began.
  baseline:number;
  target:Day;
  // Lessons that may be done but were never confirmed; they count as remaining until logged.
  needsConfirmation?:number[];
  // The planned next lesson skips ahead of unconfirmed ones.
  plannedFrom?:number;
  // From the book's table of contents, when we have it. Without units the book shows as one sticker grid.
  units?:Unit[];
  titles?:string[];
}
// A book-based curriculum on a weekday plan, books one after another (Math 5 then Math 6).
export interface CourseSubject {
  type:'course';
  id:string;
  name:string;
  start:Day;
  // Field that holds the book on saved entries ('book' for Math, 'level' for English).
  bookField:'book'|'level';
  books:Book[];
  askTopic?:boolean;
}
export interface Song {id:string;title:string;[itemField:string]:string}
// Open-ended practice with minutes per activity, shown a month at a time (Music, Sports).
export interface PracticeSubject {
  type:'practice';
  id:string;
  name:string;
  start:Day;
  // Field that holds the activity on saved entries ('instrument' for Music, 'activity' for Sports).
  itemField:'instrument'|'activity';
  items:Item[];
  maxMinutes:number;
  // A teacher lesson is a fixed length, so the form doesn't ask.
  lessons?:{minutes:number};
  // A song bank per item; a practice names songs from it or says what was practiced.
  songs?:{starting:Song[];maxTitle:number;maxPerLog:number};
  labels:{items:string;minutes:string;focus:string};
  // Big minute buttons instead of a number box; Other still opens the box.
  minuteChoices:number[];
  // "Something else": an activity outside the list, named by her.
  other?:{maxName:number};
  // Asks how it felt: tough, good, or amazing.
  feel?:boolean;
  // She may set a goal of days per week.
  goal?:boolean;
  // Badges earned from what she logs; mix is how many different activities in one week earn "Mix it up".
  badges?:{mix:number};
}
export const FEELS=['tough','good','amazing'] as const;
export type Feel=typeof FEELS[number];
export const OTHER='other';
export type Subject=CourseSubject|PracticeSubject;
// A weekly league across course subjects: lessons finished each week, up to perSubject from each, move her up a league.
// Below stay she moves down one. A week Mom marks off counts neither way.
export interface League {start:string;subjects:string[];perSubject:number;stay:number;tiers:number}
export interface Student {id:string;name:string;timezone:string;subjects:Subject[];league?:League}
