// Full-screen celebration: sticker pop, flying unicorn with a rainbow trail, and confetti.
// Respects Tweaks › Celebrations › Calm and the device's reduced-motion setting. Each subject has its own jingle.
import {play,unlock} from './sounds.js';
const $=selector=>document.querySelector(selector);
const COLORS=['#f08a9b','#f6c453','#7fd1a8','#7bb8f0','#b79cf0','#ffffff'];
const calm=()=>document.documentElement.dataset.effects==='calm'||matchMedia('(prefers-reduced-motion: reduce)').matches;

function confetti(){
  const box=$('#confetti');box.replaceChildren();
  if(calm()) return;
  for(let i=0;i<90;i++){
    const piece=document.createElement('i');
    if(i%4===0) piece.className='round';
    const size=6+Math.random()*8;
    piece.style.setProperty('--x',Math.random()*100+'vw');
    piece.style.setProperty('--w',size+'px');
    piece.style.setProperty('--h',(piece.className?size:size*1.5)+'px');
    piece.style.setProperty('--c',COLORS[i%COLORS.length]);
    piece.style.setProperty('--d',(2.4+Math.random()*2)+'s');
    piece.style.setProperty('--delay',(Math.random()*1.2)+'s');
    piece.style.setProperty('--drift',(Math.random()*160-80)+'px');
    piece.style.setProperty('--spin',(Math.random()*720-360)+'deg');
    box.append(piece);
  }
}
function restartFlight(){
  const flight=$('.unicorn-flight');
  const fresh=flight.cloneNode(true);
  flight.replaceWith(fresh);
}

export function celebrate({sticker,title,message,label,percent,count,mascot='/unicorn.svg',sound,big=false}){
  play(sound,{big});
  const dialog=$('#celebration');
  const mascotImage=document.querySelector('.unicorn-flight img');
  if(mascotImage) mascotImage.src=mascot;
  $('#celebrate-sticker').textContent=sticker;
  $('#celebrate-title').textContent=title;
  $('#celebrate-message').textContent=message;
  $('#celebrate-progress').hidden=label==null;
  if(label!=null){
    $('#celebrate-book').textContent=label;
    $('#celebrate-percent').textContent=`${percent}%`;
    $('#celebrate-count').textContent=count;
    $('#celebrate-bar').style.width='0';
  }
  restartFlight();confetti();
  if(!dialog.open) dialog.showModal();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(label!=null)$('#celebrate-bar').style.width=percent+'%';}));
  $('#celebrate-close').focus();
}
export function initCelebration(){
  const dialog=$('#celebration');
  $('#celebrate-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>$('#confetti').replaceChildren());
  ['pointerdown','keydown'].forEach(type=>document.addEventListener(type,unlock,{capture:true,passive:true}));
}
