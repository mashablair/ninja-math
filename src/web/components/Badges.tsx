import {useId} from 'react';
import {pretty} from '../../domain/dates.ts';
import {earnedBadges,type Badge} from '../../domain/subjects/practice.ts';
import type {PracticeSubject} from '../../domain/subjects/types.ts';
import {badgeLook,badgeOrder,type BadgeLook} from '../badges.ts';
import {cx} from '../format.ts';
import {BeltIcon,LeagueShield} from './Icons.tsx';
import {practiceCopy} from '../subjects.ts';

export function BadgeMedal({look,earned}:{look:Pick<BadgeLook,'image'|'text'>&{belt?:number;league?:number};earned:boolean}) {
  return <span className={cx('medal',earned?'earned':'locked',(look.belt??look.league)!=null&&'icon')} aria-hidden="true">
    {look.belt!=null?<BeltIcon belt={look.belt} size={56}/>:look.league!=null?<LeagueShield league={look.league} size={56}/>:look.image?<img src={look.image} alt="" width="64" height="64"/>:<b>{look.text}</b>}
  </span>;
}

// Her collection: what she earned, with the day, and what's still out there to try.
export function BadgesCard({subject,badges}:{subject:PracticeSubject;badges:readonly Badge[]}) {
  const title=useId(), copy=practiceCopy(subject).badges!;
  return <section className="card badges-card" aria-labelledby={title}>
    <h3 id={title}>My {subject.name.toLowerCase()} badges</h3>
    <p className="muted">{copy.intro(earnedBadges(badges).length)}</p>
    <ul className="badge-grid">{badgeOrder(badges).map(badge=>{
      const look=badgeLook(subject,badge), earned=!!badge.earned;
      const text=!earned?look.todo:badge.kind==='month'?look.detail:`${look.detail} · ${pretty(badge.earned!)}`;
      return <li key={badge.id} className={earned?'earned':'locked'}>
        <BadgeMedal look={look} earned={earned}/>
        <strong>{look.name}</strong><span>{text}</span>
        {!earned&&<span className="visually-hidden">Not earned yet</span>}
      </li>;
    })}</ul>
  </section>;
}
