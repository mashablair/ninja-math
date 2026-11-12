import {z} from 'zod';
import {today,isRealDay,longDate,mondayOf} from './dates.ts';
import {ValidationError} from './errors.ts';
import {NINJA,subjectOf} from './student.ts';
import {FEELS,OTHER,type CourseSubject,type PracticeSubject,type Student} from './subjects/types.ts';

// Saved entries carry a format version so later changes can upgrade old ones when they are read.
export const ENTRY_VERSION=1;
export const ID=/^[a-zA-Z0-9-]{8,80}$/;
const NOTE='Keep notes under 500 characters.';
const note=z.string({error:NOTE}).max(500,{error:NOTE}).transform(s=>s.trim());

// Music and Sports can be backfilled from any earlier day (start is null); courses begin on their start date.
function day(start:string|null,timeZone:string) {
  const error=start?`Choose a real date from ${longDate(start)} through today.`:'Choose a real date up to today.';
  return z.string({error}).refine(value=>isRealDay(value)&&(!start||value>=start)&&value<=today(new Date(),timeZone),{error});
}

function courseSchema(subject:CourseSubject,timeZone:string) {
  const CHECKIN='Choose a valid book and check-in.', LESSON=`Choose a lesson from 1–${subject.books[0]!.lessons} and its completed amount.`, TOPIC='Keep the lesson topic under 100 characters.';
  const books=subject.books.map(book=>book.id);
  return z.object({
    subject:z.literal(subject.id),
    date:day(subject.start,timeZone),
    status:z.enum(['complete','partial','skipped','fixed'],{error:CHECKIN}),
    note,
    reason:z.string({error:NOTE}).max(100,{error:NOTE}).transform(s=>s.trim()),
    lesson:z.unknown().optional(),
    progress:z.unknown().optional(),
    book:z.unknown().optional(),
    level:z.unknown().optional(),
    topic:subject.askTopic?z.string({error:TOPIC}).max(100,{error:TOPIC}).default(''):z.unknown().optional()
  }).superRefine((entry,ctx)=>{
    if(entry.status==='skipped') return;
    const book=subject.books.find(b=>b.id===(entry[subject.bookField]??(books.length===1?books[0]:undefined)));
    const lessons=book?.lessons??120, fixed=entry.status==='fixed';
    // A fix-up names a lesson but no amount: the lesson was already finished.
    if(!Number.isInteger(entry.lesson)||(entry.lesson as number)<1||(entry.lesson as number)>lessons||(!fixed&&(![0.25,0.5,0.75,1].includes(entry.progress as number)||(entry.status==='complete')!==(entry.progress===1)))) ctx.addIssue({code:'custom',message:LESSON});
  }).superRefine((entry,ctx)=>{
    const value=entry[subject.bookField]??(books.length===1?books[0]:undefined);
    if(!books.includes(value as number)) ctx.addIssue({code:'custom',message:CHECKIN});
  }).transform(entry=>{
    const skipped=entry.status==='skipped', fixed=entry.status==='fixed';
    const saved:Record<string,unknown>={v:ENTRY_VERSION,subject:subject.id,date:entry.date,status:entry.status,lesson:skipped?null:entry.lesson,progress:skipped||fixed?0:entry.progress,note:entry.note,reason:fixed?'':entry.reason};
    saved[subject.bookField]=entry[subject.bookField]??books[0];
    if(subject.askTopic) saved.topic=skipped||fixed?'':String(entry.topic).trim();
    return saved;
  });
}

function practiceSchema(subject:PracticeSubject,timeZone:string) {
  const field=subject.itemField, other=subject.other, ids=[...subject.items.map(item=>item.id),...(other?[OTHER]:[])] as [string,...string[]];
  const MINUTES=`Choose the minutes you ${subject.labels.minutes}, from 1 to ${subject.maxMinutes}.`, FOCUS=`Keep ${subject.labels.focus} under 200 characters.`;
  const songs=subject.songs, SONGS=`Choose the songs you ${subject.labels.minutes}.`;
  const NAME=`Type what you did, up to ${other?.maxName} characters.`, FEEL='Choose tough, good, or amazing.';
  const isOther=(entry:Record<string,unknown>)=>!!other&&entry[field]===OTHER;
  return z.object({
    subject:z.literal(subject.id),
    date:day(null,timeZone),
    [field]:z.enum(ids,{error:`Choose one of the ${subject.labels.items}.`}),
    ...(subject.lessons?{kind:z.enum(['practice','lesson'],{error:'Choose practice or a lesson with your teacher.'})}:{}),
    minutes:z.number({error:MINUTES}).int({error:MINUTES}).min(1,{error:MINUTES}).max(subject.maxMinutes,{error:MINUTES}),
    ...(songs?{songs:z.array(z.string({error:SONGS}).regex(ID,{error:SONGS}),{error:SONGS}).max(songs.maxPerLog,{error:SONGS}).default([]).transform(list=>[...new Set(list)])}:{}),
    ...(other?{name:z.string({error:NAME}).trim().max(other.maxName,{error:NAME}).optional()}:{}),
    ...(subject.feel?{feel:z.enum(FEELS,{error:FEEL}).optional()}:{}),
    focus:z.string({error:FOCUS}).max(200,{error:FOCUS}).transform(s=>s.trim()),
    note
  }).superRefine((entry,ctx)=>{
    if(songs&&!(entry.songs as string[]).length&&!entry.focus) ctx.addIssue({code:'custom',message:`Choose a song or write ${subject.labels.focus}.`});
    if(isOther(entry)&&!entry.name) ctx.addIssue({code:'custom',message:NAME});
  }).transform(entry=>{
    const saved:Record<string,unknown>={v:ENTRY_VERSION,...entry};
    // Only "Something else" keeps a name, and a feeling is saved only when she picked one.
    if(!isOther(entry)) delete saved.name;
    if(saved.feel===undefined) delete saved.feel;
    return saved;
  });
}

function goalSchema(student:Student) {
  const owners=student.subjects.filter(s=>s.type==='practice'&&s.goal).map(s=>s.id) as [string,...string[]];
  const DAYS='Choose a goal from 1 to 7 days a week.';
  return z.object({
    subject:z.literal('goal'),
    of:z.enum(owners,{error:'Choose a valid subject for this goal.'}),
    days:z.number({error:DAYS}).int({error:DAYS}).min(1,{error:DAYS}).max(7,{error:DAYS})
  }).transform(entry=>({v:ENTRY_VERSION,...entry}));
}

// A week Mom marks off for the league: a Monday from the league's first week through this one.
function weekOffSchema(student:Student) {
  const start=mondayOf(student.league!.start), WEEK='Choose a week from the league’s first week through this one.';
  return z.object({
    subject:z.literal('weekoff'),
    week:z.string({error:WEEK}).refine(value=>isRealDay(value)&&mondayOf(value)===value&&value>=start&&value<=mondayOf(today(new Date(),student.timezone)),{error:WEEK})
  }).transform(entry=>({v:ENTRY_VERSION,...entry}));
}

// Mom's check on a finished lesson: every answer is right. The day is when she checked it.
function checkedSchema(student:Student) {
  const courses=student.subjects.filter((s):s is CourseSubject=>s.type==='course'), CHECK='Choose a lesson to check.';
  return z.object({
    subject:z.literal('checked'),
    of:z.enum(courses.map(s=>s.id) as [string,...string[]],{error:'Choose a valid subject for this check.'}),
    book:z.number({error:CHECK}).int({error:CHECK}),
    lesson:z.number({error:CHECK}).int({error:CHECK}),
    date:day(null,student.timezone)
  }).superRefine((entry,ctx)=>{
    const book=courses.find(s=>s.id===entry.of)!.books.find(b=>b.id===entry.book);
    if(!book||entry.lesson<1||entry.lesson>book.lessons) ctx.addIssue({code:'custom',message:CHECK});
  }).transform(entry=>({v:ENTRY_VERSION,...entry}));
}

function songSchema(subject:PracticeSubject) {
  const field=subject.itemField, ids=subject.items.map(item=>item.id) as [string,...string[]], max=subject.songs!.maxTitle;
  const TITLE=`Choose a song name up to ${max} characters.`;
  return z.object({
    subject:z.literal('song'),
    [field]:z.enum(ids,{error:`Choose one of the ${subject.labels.items} for this song.`}),
    title:z.string({error:TITLE}).trim().min(1,{error:TITLE}).max(max,{error:TITLE}),
    archived:z.boolean({error:'Choose whether the song is archived.'})
  }).transform(entry=>({v:ENTRY_VERSION,...entry}));
}

export function schemaFor(input:Record<string,unknown>,student:Student=NINJA) {
  if(input.subject==='song') {
    const owner=student.subjects.find((s):s is PracticeSubject=>s.type==='practice'&&!!s.songs);
    return owner?songSchema(owner):null;
  }
  if(input.subject==='checked') return checkedSchema(student);
  if(input.subject==='weekoff') return student.league?weekOffSchema(student):null;
  if(input.subject==='goal') return student.subjects.some(s=>s.type==='practice'&&s.goal)?goalSchema(student):null;
  const subject=subjectOf(student,input.subject);
  if(!subject) return null;
  return subject.type==='course'?courseSchema(subject,student.timezone):practiceSchema(subject,student.timezone);
}

// Checks and normalizes a check-in before it is saved. Throws ValidationError with a message for the form.
export function validate(input:unknown,student:Student=NINJA):Record<string,unknown> {
  if(!input||typeof input!=='object'||Array.isArray(input)) throw new ValidationError('Choose a valid check-in.');
  const schema=schemaFor(input as Record<string,unknown>,student);
  if(!schema) throw new ValidationError('Choose a valid subject.');
  const result=schema.safeParse(input);
  if(!result.success) throw new ValidationError(result.error.issues[0]!.message);
  return result.data as Record<string,unknown>;
}
