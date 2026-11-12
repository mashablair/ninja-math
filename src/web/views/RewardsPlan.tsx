import {useId,useState} from 'react';
import {pretty} from '../../domain/dates.ts';
import {weekOffId,type LeagueWeek} from '../../domain/league.ts';
import type {CourseSummary} from '../../domain/subjects/course.ts';
import type {CourseSubject} from '../../domain/subjects/types.ts';
import {LeagueShield} from '../components/Icons.tsx';
import {beltName,leagueName} from '../messages/rewards.ts';
import {STUDENT,bookLabel,subjectById} from '../subjects.ts';
import {useAuth} from '../state/auth.tsx';
import {useData,useLeague} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// For Mom: each unit with its belt and when it was earned.
export function UnitsTable({subject,s}:{subject:CourseSubject;s:CourseSummary}) {
  const title=useId();
  if(!s.units.length) return null;
  return <section className="card table-card" aria-labelledby={title}>
    <h2 id={title}>Units and belts</h2>
    <div className="table-scroll"><table>
      <thead><tr><th>Unit</th><th>Lessons</th><th>Belt</th><th>Done</th><th>Status</th></tr></thead>
      <tbody>{s.units.map(u=><tr key={`${u.book}-${u.number}`}>
        <th scope="row">{bookLabel(subject,u.book)} · Unit {u.number}</th>
        <td>{u.first}–{u.last}{u.review?` (review ${u.review})`:''}{u.projects?` (projects ${u.projects.join(', ')})`:''}</td>
        <td>{beltName(u.belt)}</td>
        <td>{u.finished} of {u.lessons}{u.finished>u.checked?` (${u.finished-u.checked} to check)`:''}</td>
        <td>{u.earned?u.earnedOn?`Earned ${pretty(u.earnedOn,true)}`:'Earned before check-ins':u.finished===u.lessons?'Waiting for your check':s.unit===u?'In progress':'Coming up'}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="goal-foot">A belt is earned when every lesson in the unit is finished{s.units.some(u=>u.test)?', including the assessment at the end':''}, and you’ve checked each one.</p>
  </section>;
}

const RESULT={up:'Moved up',stay:'Stayed',down:'Moved down',off:'Week off'} as const;
// For Mom: the league week by week. A week off (sick, travel) counts neither way; it can be undone.
export function LeaguePlan() {
  const s=useLeague(), {ready,mutate}=useData(), {requireLogin}=useAuth(), ui=useUi(), title=useId(), [busy,setBusy]=useState(false);
  if(!s) return null;
  const config=STUDENT.league!, weeks=[s.week,...s.history];
  const toggle=(week:LeagueWeek)=>requireLogin(async()=>{
    setBusy(true);
    try{
      await mutate(week.off?'remove':'save',weekOffId(week.monday),week.off?undefined:{subject:'weekoff',week:week.monday});
      ui.toast(week.off?`The week of ${pretty(week.monday)} counts again.`:`The week of ${pretty(week.monday)} is a week off.`);
    }catch(failure){ui.toast((failure as Error).message);}
    finally{setBusy(false);}
  });
  return <section className="card table-card league-table" aria-labelledby={title}>
    <div className="league-top"><LeagueShield league={s.league} size={52}/><div><span className="label">League</span><h2 id={title}>{leagueName(s.league)}</h2></div></div>
    <p className="muted">{config.perSubject} lessons each in {config.subjects.map(id=>subjectById(id)?.name).join(' and ')} moves her up a league. {s.stay}–{s.goal-1} keeps her there; fewer moves her down one, never below {leagueName(0)}. Starting progress and lessons waiting for a check don’t count.</p>
    <div className="table-scroll"><table>
      <thead><tr><th>Week of</th>{config.subjects.map(id=><th key={id}>{subjectById(id)?.name}</th>)}<th>Points</th><th>League</th><th>Result</th><th><span className="visually-hidden">Week off</span></th></tr></thead>
      <tbody>{weeks.map(week=><tr key={week.monday}>
        <th scope="row">{pretty(week.monday)}{week===s.week?' (this week)':''}</th>
        {config.subjects.map(id=><td key={id}>{week.lessons[id]??0}</td>)}
        <td>{week.points} of {s.goal}</td>
        <td>{leagueName(week.league)}</td>
        <td>{week.result?RESULT[week.result]:week.off?'Week off':'In progress'}</td>
        <td><button type="button" className="secondary" disabled={!ready||busy} onClick={()=>toggle(week)}
          aria-label={`${week.off?'Count':'Mark off'} the week of ${pretty(week.monday)}`}>{week.off?'Count it':'Week off'}</button></td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
