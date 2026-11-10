import type {Badge} from '../domain/subjects/practice.ts';
import type {PracticeSubject} from '../domain/subjects/types.ts';
import {monthLabel,monthName} from './format.ts';
import {itemImage,practiceCopy} from './subjects.ts';

// How a badge looks and reads: a ninja for a first time, a number or star for the others, the month's name for a month.
export interface BadgeLook {image?:string;text?:string;name:string;detail:string;todo:string}
export function badgeLook(subject:PracticeSubject,badge:Badge):BadgeLook {
  const copy=practiceCopy(subject).badges!;
  if(badge.kind==='first'){const [name,detail,todo]=copy.first[badge.item!]!;return {image:itemImage(subject,badge.item!),name,detail,todo};}
  if(badge.kind==='mix'){const [name,detail,todo]=copy.mix;return {text:String(subject.badges!.mix),name,detail,todo};}
  if(badge.kind==='all'){const [name,detail,todo]=copy.all;return {text:'★',name,detail,todo};}
  const [name]=copy.month(monthName(badge.month!,false)), [,detail]=copy.month(monthName(badge.month!));
  return {text:monthLabel(badge.month!),name,detail,todo:detail};
}
// Earned ones first, then each month she moved, then the ones still to earn.
export function badgeOrder(badges:readonly Badge[]):Badge[] {
  const months=badges.filter(b=>b.kind==='month'), rest=badges.filter(b=>b.kind!=='month');
  return [...rest.filter(b=>b.earned),...months,...rest.filter(b=>!b.earned)];
}
