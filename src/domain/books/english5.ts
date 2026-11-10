import type {Unit} from '../subjects/types.ts';

// English 5 (The Good and the Beautiful): six units with project lessons along the way. Lessons have no names
// and there are no unit assessments, so a belt comes from finishing every lesson in the unit.
export const ENGLISH5_UNITS:Unit[]=[
  {first:1,last:20,projects:[10,16]},
  {first:21,last:43,projects:[32,42]},
  {first:44,last:63,projects:[50,62]},
  {first:64,last:83,projects:[70,82]},
  {first:84,last:103,projects:[93,102]},
  {first:104,last:120,projects:[111,119]}
];
export const ENGLISH5_TITLES=Array.from({length:120},(_,i)=>ENGLISH5_UNITS.some(u=>u.projects?.includes(i+1))?'Project Lesson':'');
