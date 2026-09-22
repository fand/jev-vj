import {transitionProgress} from './performance-controls.js';

// One final composite feeds both the deck and the popup, including live FX,
// both sides of a transition, blackout and momentary strobe.
export function createDeckOutput(canvas, notify, onRemoteKey) {
 const ctx=canvas.getContext('2d',{alpha:false});
 let current=null, outgoing=null, transition=null, killed=false, flash=null;
 let popup=null, stream=null, popupTimer, raf;
 function connect(engine){
  const buffer=document.createElement('canvas'), context=buffer.getContext('2d',{alpha:false});
  const view={engine,buffer,ready:false};
  engine.onFrame=(source,crop)=>{
   const width=Math.round(crop?.[2]||source.width||source.videoWidth), height=Math.round(crop?.[3]||source.height||source.videoHeight);
   if(!width||!height)return;
   // Each source includes its own letterbox, so different aspect ratios fade cleanly.
   if(buffer.width!==1280||buffer.height!==720){buffer.width=1280;buffer.height=720;}
   context.fillStyle='#000';context.fillRect(0,0,buffer.width,buffer.height);
   const scale=Math.min(buffer.width/width,buffer.height/height);
   const dest=[(buffer.width-width*scale)/2,(buffer.height-height*scale)/2,width*scale,height*scale];
   if(crop)context.drawImage(source,...crop,...dest);else context.drawImage(source,...dest);
   view.ready=true;
  };
  engine.captureFrame();
  return view;
 }
 function draw(view,alpha=1){
  if(!view?.ready)return;
  const image=view.buffer, scale=Math.min(canvas.width/image.width,canvas.height/image.height);
  ctx.globalAlpha=alpha;
  ctx.drawImage(image,(canvas.width-image.width*scale)/2,(canvas.height-image.height*scale)/2,image.width*scale,image.height*scale);
 }
 function render(now){
  // Stable 16:9 output resolution also keeps popup streams stable on UI resize.
  if(canvas.width!==1280||canvas.height!==720){canvas.width=1280;canvas.height=720;}
  ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(transition){
   const progress=transitionProgress(now,transition.start,transition.seconds);
   draw(outgoing);draw(current,progress);
   if(progress===1){const done=transition.resolve;transition=null;outgoing=null;done();}
  }else draw(current);
  ctx.globalAlpha=1;
  const flashing=flash&&((now-flash.start)/1000*12)%1<.5;
  if(killed||flashing){ctx.fillStyle=killed||!flash?.white?'#000':'#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}
  canvas.dataset.blackout=String(killed);canvas.dataset.strobe=flash?(flash.white?'white':'black'):'off';
  canvas.dataset.transition=transition?'running':'idle';
  raf=requestAnimationFrame(render);
 }
 raf=requestAnimationFrame(render);
 function show(view,seconds=0){
  transition?.resolve();transition=null;
  outgoing=current;current=view;
  if(!outgoing||seconds<=0){outgoing=null;return Promise.resolve();}
  return new Promise(resolve=>{transition={start:performance.now(),seconds,resolve};});
 }
 function clear(){transition?.resolve();transition=null;current=null;outgoing=null;}
 function strobe(white){flash=white===null?null:{white,start:performance.now()};}
 function openPopup(){
  if(popup&&!popup.closed){popup.focus();return;}
  if(!canvas.captureStream){notify('This browser does not support live output windows.',true);return;}
  popup=window.open('/output-popup.html','jev-output','popup,width=1280,height=720');
  if(!popup)notify('Allow popups for this site to open the output window.',true);
  else popupTimer=setTimeout(()=>notify('Output window did not connect. Allow popups or open the deck in Chrome.',true),4000);
 }
 function receive(event){
  if(event.origin!==location.origin||event.source!==popup)return;
  if(['output-key','output-keyup','output-blur'].includes(event.data?.type)){onRemoteKey(event.data);return;}
  if(event.data?.type!=='output-ready')return;
  clearTimeout(popupTimer);
  stream?.getTracks().forEach(track=>track.stop());stream=canvas.captureStream(60);
  const video=popup.document.querySelector('video');video.srcObject=stream;
  void video.play().catch(()=>notify('Click Play in the output window to start it.',true));
 }
 window.addEventListener('message',receive);
 function dispose(){
  cancelAnimationFrame(raf);clearTimeout(popupTimer);clear();stream?.getTracks().forEach(track=>track.stop());
  window.removeEventListener('message',receive);if(popup&&!popup.closed)popup.close();
 }
 return {connect,show,clear,strobe,openPopup,dispose,
  blackout(value){killed=Boolean(value);},
  disconnect(view){view.engine.onFrame=null;},
 };
}
