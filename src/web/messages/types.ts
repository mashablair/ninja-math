import type {Day} from '../../domain/dates.ts';
import type {CourseSummary} from '../../domain/subjects/course.ts';

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
  mascotFor?(item:string):string;
  preview:{sticker:string;title:string;message:string};
  today:{label:string;heading:string;intro:string;empty:string;days:string};
  actions:{practice:[title:string,hint:string];lesson?:[title:string,hint:string]};
  calendar:{heading:string;intro:string};
  form:{
    title(kind:'practice'|'lesson',editing:boolean):string;
    itemLegend:string;
    focus:{label:string;placeholder:string};
    defaultMinutes:number;
    // Which item a new log starts on: the first one not logged today, or the last one used.
    defaultItem:'unlogged'|'last';
  };
}
