import {useId,useState} from 'react';
import {summarizeCourse} from '../../domain/subjects/course.ts';
import {summarizePractice} from '../../domain/subjects/practice.ts';
import type {Subject} from '../../domain/subjects/types.ts';
import {CloseButton,Modal} from '../components/Modal.tsx';
import {previewCelebration} from '../celebrations.ts';
import {readTweaks,setTweak,type Tweak} from '../tweaks.ts';
import {useAuth} from '../state/auth.tsx';
import {useData,useToday} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

const CHOICES:{key:Tweak;legend:string;style:'swatches'|'segmented';options:[value:string,label:string][]}[]=[
  {key:'color',legend:'Color',style:'swatches',options:[['lavender','Lavender'],['ocean','Ocean'],['berry','Berry'],['forest','Mint']]},
  {key:'mode',legend:'Light or dark',style:'segmented',options:[['light','Light'],['dark','Dark'],['auto','Match device']]},
  {key:'text',legend:'Text size',style:'segmented',options:[['normal','Normal'],['large','Large']]},
  {key:'effects',legend:'Celebrations',style:'segmented',options:[['full','Unicorn + confetti'],['calm','Calm']]},
  {key:'sound',legend:'Sounds',style:'segmented',options:[['on','On'],['off','Off']]}
];

export function TweaksDialog({open,onClose,subject}:{open:boolean;onClose():void;subject:Subject}) {
  const title=useId(), {authed,requireLogin,logOut}=useAuth(), {entries}=useData(), day=useToday(), ui=useUi();
  const [tweaks,setTweaks]=useState(readTweaks), [status,setStatus]=useState(''), [busy,setBusy]=useState(false);
  const change=(key:Tweak,value:string)=>{setTweak(key,value);setTweaks(readTweaks());};
  function preview() {
    onClose();
    const summary=subject.type==='course'?summarizeCourse(subject,entries,day):summarizePractice(subject,entries,day);
    ui.celebrate(previewCelebration(subject,summary));
  }
  async function account() {
    if(!authed){onClose();requireLogin(()=>{});return;}
    setBusy(true);setStatus('');
    try{await logOut();}catch{setStatus('Could not log out. Try again.');}
    finally{setBusy(false);}
  }
  return <Modal open={open} onClose={onClose} labelledBy={title}>
    <div className="dialog-header"><h2 id={title}>Tweaks</h2><CloseButton label="Close tweaks" onClick={onClose}/></div>
    <form>{CHOICES.map(({key,legend,style,options})=><fieldset key={key}><legend>{legend}</legend><div className={style}>
      {options.map(([value,label])=><label key={value} className={style==='swatches'?`swatch ${value}`:undefined}>
        <input type="radio" name={key} value={value} checked={tweaks[key]===value} onChange={()=>change(key,value)}/><span>{label}</span>
      </label>)}
    </div></fieldset>)}</form>
    <button type="button" className="secondary save-button" onClick={preview}>Preview the celebration</button>
    <p className="small muted">{status||(authed?'Logged in on this device. Saving stays available for 30 days.':'Looking is open. Saving a check-in needs a login.')}</p>
    <button type="button" className="secondary save-button" disabled={busy} onClick={account}>{authed?'Log out':'Log in'}</button>
    <p className="small muted">Color, text, celebrations, and sounds are saved on this device.</p>
  </Modal>;
}
