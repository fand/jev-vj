import { VFX } from '@vfx-js/core';
import { definitions } from './effects/registry';
import { defaults, sanitize, type EffectParams } from './effects/types';
import { MixedEffect } from './effects/mix';

export type EffectSetting = { id: string; params: EffectParams; mix: number };
const preview = new URLSearchParams(location.search).has('preview');
if(preview)document.getElementById('playback')!.hidden=true;
const video = document.querySelector<HTMLVideoElement>('#video')!;
const makeBank = () => new Map(definitions.map(def=>[def.id,new MixedEffect(def.create(defaults(def)))]));
let bank = makeBank();
let vfx: VFX | undefined;
let registered = false;
let registration: Promise<void> | undefined;
let chain: EffectSetting[] = [];
let bypassed = false;
let failure = '';
let frame = 0;

function reset() { for(const node of bank.values())node.instance.reset?.(); }
function fallback(error: unknown) {
  failure=error instanceof Error?error.message:String(error);
  registered=false;vfx?.destroy();vfx=undefined;chain=[];
  video.style.opacity='1';video.style.visibility='visible';
  parent.postMessage({type:'effects-error',error:failure},location.origin);
}
async function ensure() {
  if(registered)return;
  if(registration)return registration;
  if(failure){failure='';bank=makeBank();}
  registration=(async()=>{
    if(!video.getAttribute('src'))throw Error('Select a clip first.');
    if(video.readyState<2)await new Promise<void>((resolve,reject)=>{
      const ready=()=>{cleanup();resolve();};const fail=()=>{cleanup();reject(Error('Could not load the video.'));};
      const timeout=setTimeout(fail,15000);
      const cleanup=()=>{clearTimeout(timeout);video.removeEventListener('loadeddata',ready);video.removeEventListener('error',fail);video.removeEventListener('emptied',fail);};
      video.addEventListener('loadeddata',ready,{once:true});video.addEventListener('error',fail,{once:true});
      video.addEventListener('emptied',fail,{once:true});
    });
    vfx=new VFX({autoplay:false,pixelRatio:Math.min(preview ? .7 : 1,1280/Math.max(innerWidth,1)),scrollPadding:false});
    await vfx.add(video,{effect:[...bank.values()]});registered=true;
  })().catch(error=>{fallback(error);throw error;}).finally(()=>{registration=undefined;});
  return registration;
}
function syncEnabled() {
  const ids=new Set(chain.map(e=>e.id));
  for(const [id,node]of bank)node.enabled=!bypassed&&ids.has(id);
}
async function apply(settings: EffectSetting[]) {
  if(!Array.isArray(settings))throw Error('Invalid effect chain');
  const unique=new Set<string>();
  const next=settings.map(item=>{
    const def=definitions.find(d=>d.id===item.id);
    if(!def||unique.has(item.id)||!Number.isFinite(item.mix))throw Error('Invalid effect');
    unique.add(item.id);return {id:item.id,params:sanitize(def,item.params||{}),mix:item.id==='trails'?1:Math.max(0,Math.min(1,item.mix))};
  });
  await ensure();
  for(const item of next){const node=bank.get(item.id)!;if(!node.enabled){node.instance.reset?.();node.amount=0;}node.instance.setParams(item.params);node.targetAmount=item.mix;if(item.id==='trails')node.amount=1;}
  chain=next;syncEnabled();
  try{vfx!.render();}catch(error){fallback(error);throw error;}
  return structuredClone(chain);
}
let lastFrame = 0;
function render(now = 0) {
  if((!preview || now-lastFrame>=1000/20) && registered&&!video.paused&&video.readyState>=2){lastFrame=now;try{vfx!.render();}catch(error){fallback(error);}}
  frame=requestAnimationFrame(render);
}
// Native dimensions keep object-fit letterboxing out of the shader's content UV.
function resizeVideo() {
  const aspect=(video.videoWidth||16)/(video.videoHeight||9);
  const width=Math.min(innerWidth,innerHeight*aspect);
  video.style.width=`${width}px`;video.style.height=`${width/aspect}px`;reset();
}
video.addEventListener('loadedmetadata',resizeVideo);
video.addEventListener('loadstart',reset);
video.addEventListener('seeking',reset);
window.addEventListener('resize',resizeVideo);
video.addEventListener('loadeddata',()=>{void ensure().catch(()=>{});});
document.getElementById('playback')!.addEventListener('click',()=>{if(video.paused)void video.play();else video.pause();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);vfx?.destroy();});
const renderer={video,definitions:definitions.map(({create,...def})=>def),apply,reset,
  get chain(){return structuredClone(chain);},get error(){return failure;},
  bypass(value:boolean){bypassed=value;syncEnabled();if(registered)vfx!.render();},
};
(window as unknown as {jevRenderer:typeof renderer}).jevRenderer=renderer;
render();parent.postMessage({type:'effects-ready'},location.origin);
