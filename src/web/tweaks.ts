// Tweaks are per device: public/theme.js applies them before first paint; this keeps them in sync after.
export const TWEAKS=['color','mode','text','effects','sound','voice'] as const;
export type Tweak=typeof TWEAKS[number];
export type Tweaks=Record<Tweak,string>;
const root=()=>document.documentElement;

export const readTweaks=():Tweaks=>Object.fromEntries(TWEAKS.map(key=>[key,root().dataset[key]??''])) as Tweaks;
export function setTweak(key:Tweak,value:string) {
  root().dataset[key]=value;
  try{localStorage.setItem('ninja-tweaks',JSON.stringify(readTweaks()));}catch{}
  syncThemeColor();
}
export function syncThemeColor() {
  const meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if(meta) meta.content=getComputedStyle(root()).getPropertyValue('--bg').trim()||'#fbf8f4';
}
export const calmEffects=()=>root().dataset.effects==='calm'||matchMedia('(prefers-reduced-motion: reduce)').matches;
export const soundOn=()=>root().dataset.sound!=='off';
// Sassy unless she picked gentle: Ninja teases her when Math or English lessons slip.
export const sassyVoice=()=>root().dataset.voice!=='gentle';
