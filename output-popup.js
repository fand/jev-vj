import {performanceAction} from './performance-controls.js';
const video=document.querySelector('video');
const status=document.getElementById('status');
async function fullscreen(){
 try{await document.documentElement.requestFullscreen();status.textContent='Move this window to your display, then enter fullscreen.';}
 catch{status.textContent='Fullscreen unavailable. Focus this window and try again.';}
}
document.getElementById('play').onclick=()=>void video.play().catch(()=>{status.textContent='Playback unavailable. Reopen this window from the deck.';});
document.getElementById('fullscreen').onclick=fullscreen;
video.ondblclick=fullscreen;
document.addEventListener('fullscreenchange',()=>{document.body.dataset.fullscreen=String(!!document.fullscreenElement);});
window.addEventListener('keydown',event=>{
 if(!performanceAction(event))return;
 event.preventDefault();
 if(window.opener&&!window.opener.closed){
  if(event.code==='Space')window.opener.focus();
  window.opener.postMessage({type:'output-key',key:event.key,code:event.code,shiftKey:event.shiftKey,ctrlKey:event.ctrlKey,altKey:event.altKey,metaKey:event.metaKey,repeat:event.repeat},location.origin);
 }
});
window.addEventListener('keyup',event=>window.opener?.postMessage({type:'output-keyup',code:event.code},location.origin));
window.addEventListener('blur',()=>window.opener?.postMessage({type:'output-blur'},location.origin));
video.addEventListener('playing',()=>window.opener?.postMessage({type:'output-playing'},location.origin));
video.addEventListener('pause',()=>window.opener?.postMessage({type:'output-paused'},location.origin));
window.opener?.postMessage({type:'output-ready'},location.origin);
window.addEventListener('pagehide',()=>window.opener?.postMessage({type:'output-closed'},location.origin));
