import {useId} from 'react';
import {daysBetween,type Day} from '../../domain/dates.ts';
import type {LeagueSummary} from '../../domain/league.ts';
import {cx,plural} from '../format.ts';
import {league as copy,leagueName} from '../messages/rewards.ts';
import {STUDENT,subjectById} from '../subjects.ts';
import {LeagueShield} from './Icons.tsx';

// This week's league: her shield, one dot per lesson toward 5 + 5, and what the week needs.
export function LeagueCard({s,day}:{s:LeagueSummary;day:Day}) {
  const title=useId(), config=STUDENT.league!, left=7-daysBetween(s.week.monday,day);
  return <section className="card league-card" aria-labelledby={title}>
    <div className="league-top">
      <LeagueShield league={s.league}/>
      <div><span className="label">My league</span><h3 id={title}>{leagueName(s.league)}</h3></div>
    </div>
    <p className="league-last">{copy.last(s)}</p>
    <div className="league-rows">{config.subjects.map(id=>{
      const done=s.week.lessons[id]??0;
      return <div key={id} className="league-row">
        <span>{subjectById(id)?.name}</span>
        <span className="league-dots" role="img" aria-label={`${Math.min(done,config.perSubject)} of ${config.perSubject} lessons`}>
          {Array.from({length:config.perSubject},(_,i)=><i key={i} className={cx(i<done&&'done')}/>)}
        </span>
        {done>config.perSubject&&<small>+{done-config.perSubject}</small>}
      </div>;
    })}</div>
    <p className="league-status"><strong>{copy.status(s,config.tiers)}</strong>{!s.week.off&&s.week.points<s.goal&&<span>{left===1?'Last day of the week!':`${plural(left,'day')} left this week.`}</span>}</p>
  </section>;
}
