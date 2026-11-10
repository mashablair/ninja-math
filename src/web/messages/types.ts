import type {Day} from '../../domain/dates.ts';
import type {CourseSummary} from '../../domain/subjects/course.ts';
import type {Feel} from '../../domain/subjects/types.ts';

// Everything a subject says on screen. Kind, specific, never guilt. No streaks, no invented achievements.
interface Copy {
  mascot:string;
  dailyMessage(day:Day,today:{loggedToday:boolean;lastStatus?:string}):string;
  week:{done:string;noun:string;empty:string};
  journal:{note:string;empty:[title:string,text:string]};
}
export interface CourseCopy extends Copy {
  bookCheer(percent:number):string;
  celebrateMessage(progress:{finished:number;book:number;bookDone:boolean;percentBefore:number;percentAfter:number}):string;
  partialMessage():string;
  breakMessage():string;
  allDone:{book:string;subtitle:string};
  plan:{
    title:string;
    taglines:Record<number,string>;
    // The span of the timeline, and display-only dates on it. Projections never read these.
    range:[from:Day,to:Day];
    school?:{date:Day;label:string};
    marks?:{date:Day;label:string}[];
    note(summary:CourseSummary):string;
    info:{summary:string;paragraphs:string[]};
  };
}
export interface PracticeCopy extends Copy {
  celebrateMessage():string;
  celebrateTitle(itemName:string,kind:'practice'|'lesson'):string;
  preview:{sticker:string;title:string;message:string};
  today:{label:string;heading:string;intro:string;done:string;saved:string};
  // The button for a lesson with a teacher, under the tiles.
  lesson?:[title:string,hint:string];
  form:{
    title(kind:'practice'|'lesson',editing:boolean):string;
    itemLegend:string;
    focus:{label:string;placeholder:string};
    defaultMinutes:number;
    // "your run", "your piano practice", for "Nice! Tell me about your run."
    about:Record<string,string>;
    picked(name:string):string;
  };
  other?:{name:string;image:string;label:string;placeholder:string};
  feel?:Record<Feel,string>;
  month:{intro:string;empty(month:string):string;nothing(day:string):string};
  thisWeek:{empty:string};
  goal?:{
    none:string;set:string;title:string;question:string;hint:string;
    progress(days:number,goal:number):string;left(days:number):string;reached:string;celebrate:string;
  };
  // [name, what earned it, how to earn it]. Months need no "how", since anything logged earns them.
  badges?:{
    intro(earned:number):string;
    first:Record<string,[name:string,detail:string,todo:string]>;
    mix:[name:string,detail:string,todo:string];
    all:[name:string,detail:string,todo:string];
    month(name:string):[name:string,detail:string];
  };
}
