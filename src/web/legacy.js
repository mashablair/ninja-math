// Bridges the course summaries to the shapes this page was written against.
// The React rewrite reads the domain summaries directly and removes this file.
import {summarizeCourse} from '../domain/subjects/course.ts';
import {MATH,ENGLISH} from '../domain/student.ts';

export function summarize(entries,asOf){
  const s=summarizeCourse(MATH,entries,asOf), five=s.books[5], six=s.books[6];
  return {progress:{5:five.progress,6:six.progress},totals:{5:five.total,6:six.total},active:s.active,backlog:s.backlog,nextLesson:s.nextLesson,math5:five.finish,math6Start:six.startsOn,math6:six.finish,loggedToday:s.loggedToday};
}
export function summarizeEnglish(entries,asOf){
  const s=summarizeCourse(ENGLISH,entries,asOf), book=s.books[5];
  return {progress:book.progress,total:book.total,nextLesson:s.nextLesson,finish:book.finish,loggedToday:s.loggedToday,completedOn:book.completedOn};
}
