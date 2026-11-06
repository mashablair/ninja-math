import type {Day} from '../dates.ts';

export interface Item {id:string;name:string}
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
// Open-ended practice with minutes per activity and a year-long calendar (Music, Sports).
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
}
export type Subject=CourseSubject|PracticeSubject;
export interface Student {id:string;name:string;timezone:string;subjects:Subject[]}
