// Short celebration jingles, synthesized with Web Audio so there are no files to load.
// Tweaks › Sounds turns them off. Browsers only allow audio after a tap, so unlock() runs on the first one.
import {soundOn} from './tweaks.ts';

let ctx:AudioContext|undefined, master:GainNode;
type Note=string|number;
const STEPS:Record<string,number>={C:-9,'C#':-8,D:-7,'D#':-6,E:-5,F:-4,'F#':-3,G:-2,'G#':-1,A:0,'A#':1,B:2};
const hz=(note:Note)=>{
  if(typeof note==='number') return note;
  const [,name,octave]=note.match(/^([A-G]#?)(\d)$/)!;
  return 440*2**((STEPS[name!]!+(Number(octave)-4)*12)/12);
};

function audio() {
  if(!ctx){
    const Ctx=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!Ctx) return null;
    ctx=new Ctx();
    const limiter=ctx.createDynamicsCompressor();limiter.connect(ctx.destination);
    master=ctx.createGain();master.gain.value=.32;master.connect(limiter);
  }
  if(ctx.state==='suspended') void ctx.resume();
  return ctx;
}
export function unlock() { if(soundOn()) audio(); }

interface Voice {type?:OscillatorType;volume?:number;attack?:number;partials?:[number,number][];filter?:number}
function tone(at:number,note:Note,length:number,{type='sine',volume=.5,attack=.01,partials=[],filter}:Voice={}) {
  const c=ctx!, freq=hz(note), env=c.createGain(), end=at+length;
  env.gain.setValueAtTime(0,at);
  env.gain.linearRampToValueAtTime(volume,at+attack);
  env.gain.exponentialRampToValueAtTime(.0001,end);
  let out:AudioNode=env;
  if(filter){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filter;env.connect(lp);out=lp;}
  out.connect(master);
  for(const [ratio,level] of [[1,1],...partials]){
    const osc=c.createOscillator(), mix=c.createGain();
    osc.type=type;osc.frequency.value=freq*ratio!;mix.gain.value=level!;
    osc.connect(mix).connect(env);osc.start(at);osc.stop(end+.05);
  }
}
const bell=(at:number,note:Note,length=.9,volume=.45)=>tone(at,note,length,{volume,attack:.005,partials:[[2.76,.25],[5.4,.08]]});
const pluck=(at:number,note:Note,length=.5,volume=.4)=>tone(at,note,length,{type:'triangle',volume,attack:.004,partials:[[2,.3]]});
const brass=(at:number,note:Note,length=.3,volume=.22)=>tone(at,note,length,{type:'sawtooth',volume,attack:.03,filter:1800});
function drum(at:number,volume=.9) {
  const c=ctx!, osc=c.createOscillator(), env=c.createGain();
  osc.frequency.setValueAtTime(160,at);osc.frequency.exponentialRampToValueAtTime(45,at+.3);
  env.gain.setValueAtTime(volume,at);env.gain.exponentialRampToValueAtTime(.0001,at+.35);
  osc.connect(env).connect(master);osc.start(at);osc.stop(at+.4);
}
function shimmer(at:number,length=.8,volume=.18) {
  const c=ctx!, buffer=c.createBuffer(1,c.sampleRate*length,c.sampleRate), data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
  const noise=c.createBufferSource(), hp=c.createBiquadFilter(), env=c.createGain();
  noise.buffer=buffer;hp.type='highpass';hp.frequency.value=6000;
  env.gain.setValueAtTime(volume,at);env.gain.exponentialRampToValueAtTime(.0001,at+length);
  noise.connect(hp).connect(env).connect(master);noise.start(at);
}

// Each returns its length in seconds.
const JINGLES:Record<string,(t:number)=>number>={
  // Math: a sparkly chime climbing up, like stars lining up.
  math(t){
    ['C6','E6','G6','C7'].forEach((note,i)=>bell(t+i*.09,note,i===3?1.3:.6));
    ['G6','E7','C7','G7'].forEach((note,i)=>bell(t+.5+i*.07,note,.35,.15));
    return 1.4;
  },
  // English: a storybook harp sweep that lands on a soft chord.
  english(t){
    ['G4','A4','B4','D5','E5','G5','A5','B5','D6'].forEach((note,i)=>pluck(t+i*.05,note,.6,.32));
    ['G5','B5','D6'].forEach(note=>tone(t+.5,note,1.3,{volume:.16,attack:.08}));
    bell(t+.5,'G6',1,.18);
    return 1.8;
  },
  // Music: a little "da-da-da-daa, da-DAA!" tune.
  music(t){
    ([['G4',0,.18],['C5',.13,.18],['E5',.26,.18],['G5',.39,.4],['E5',.62,.18],['G5',.75,.9]] as const).forEach(([note,at,length])=>pluck(t+at,note,length,.42));
    ['C4','E4','G4'].forEach(note=>pluck(t+.75,note,.9,.18));
    return 1.7;
  },
  // Sports: two big drum booms and a stadium fanfare.
  sports(t){
    drum(t);drum(t+.2);
    [.42,.52,.62].forEach(at=>brass(t+at,'C5',.12));
    ['C5','E5','G5'].forEach(note=>brass(t+.74,note,.9,.18));
    drum(t+.74,.7);shimmer(t+.74);
    return 1.7;
  }
};
// A finished book gets an extra rising flourish after the subject's own jingle.
function finale(t:number) {
  ['C5','E5','G5','C6','E6','G6','C7'].forEach((note,i)=>bell(t+i*.07,note,i===6?1.6:.5,.3));
  ['C5','E5','G5','C6'].forEach(note=>tone(t+.5,note,1.8,{volume:.12,attack:.1}));
  shimmer(t+.5,1.2,.12);
}

export function play(subject:string|undefined,{big=false}={}) {
  const jingle=subject?JINGLES[subject]:undefined;
  if(!soundOn()||!jingle) return;
  const audioCtx=audio();if(!audioCtx) return;
  const t=audioCtx.currentTime+.05, length=jingle(t);
  if(big) finale(t+length*.8);
}
