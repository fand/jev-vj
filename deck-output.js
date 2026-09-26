import {transitionProgress} from './performance-controls.js';

// Render the final composite to one destination at a time: the deck, or an
// offscreen canvas streamed to the popup. FX and playback continue in both modes.
export function createDeckOutput(canvas, notify, onRemoteKey, onPopupChange=()=>{}) {
 const ctx=canvas.getContext('2d',{alpha:false});
 const popupCanvas=document.createElement('canvas'), popupContext=popupCanvas.getContext('2d',{alpha:false});
 popupCanvas.width=1280;popupCanvas.height=720;
 let popupActive=false;
 function setPopupActive(active){
  if(popupActive===active)return;
  popupActive=active;canvas.dataset.popup=String(active);onPopupChange(active);
 }
 let current=null, outgoing=null, transition=null, killed=false, flash=null;
 let popup=null, stream=null, popupTimer, raf;
 function connect(engine, onPreview){
  const buffer=document.createElement('canvas'), context=buffer.getContext('2d',{alpha:false});
  const view={engine,buffer,ready:false};
  let lastPreview=-Infinity;
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
   const now=performance.now();
   if(onPreview&&now-lastPreview>=50){lastPreview=now;onPreview(buffer);}
  };
  engine.captureFrame();
  return view;
 }
 function draw(ctx,canvas,view,alpha=1){
  if(!view?.ready)return;
  const image=view.buffer, scale=Math.min(canvas.width/image.width,canvas.height/image.height);
  ctx.globalAlpha=alpha;
  ctx.drawImage(image,(canvas.width-image.width*scale)/2,(canvas.height-image.height*scale)/2,image.width*scale,image.height*scale);
 }
 function render(now){
  if(popup?.closed){releasePopup();popup=null;}
  const target=popupActive?popupCanvas:canvas, context=popupActive?popupContext:ctx;
  // Stable 16:9 output resolution also keeps popup streams stable on UI resize.
  if(target.width!==1280||target.height!==720){target.width=1280;target.height=720;}
  context.globalAlpha=1;context.fillStyle='#000';context.fillRect(0,0,target.width,target.height);
  if(transition){
   const progress=transitionProgress(now,transition.start,transition.seconds);
   draw(context,target,outgoing);draw(context,target,current,progress);
   if(progress===1){const done=transition.resolve;transition=null;outgoing=null;done();}
  }else draw(context,target,current);
  context.globalAlpha=1;
  const flashing=flash&&((now-flash.start)/1000*12)%1<.5;
  if(killed||flashing){context.fillStyle=killed||!flash?.white?'#000':'#fff';context.fillRect(0,0,target.width,target.height);}
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
  if(!popupCanvas.captureStream){notify('This browser does not support live output windows.',true);return;}
  popup=window.open('/output-popup.html','jev-output','popup,width=1280,height=720');
  if(!popup)notify('Allow popups for this site to open the output window.',true);
  else popupTimer=setTimeout(()=>notify('Output window did not connect. Allow popups or open the deck in Chrome.',true),4000);
 }
 function releasePopup(){
  clearTimeout(popupTimer);stream?.getTracks().forEach(track=>track.stop());stream=null;
  setPopupActive(false);onRemoteKey({type:'output-blur'});
 }
 function receive(event){
  if(event.origin!==location.origin||event.source!==popup)return;
  if(['output-key','output-keyup','output-blur'].includes(event.data?.type)){onRemoteKey(event.data);return;}
  if(event.data?.type==='output-closed'){releasePopup();return;}
  if(event.data?.type==='output-paused'){setPopupActive(false);return;}
  if(event.data?.type==='output-playing'){if(stream)setPopupActive(true);return;}
  if(event.data?.type!=='output-ready')return;
  clearTimeout(popupTimer);
  stream?.getTracks().forEach(track=>track.stop());
  try{
   stream=popupCanvas.captureStream(60);
   const video=popup.document.querySelector('video');video.srcObject=stream;
   const connectedStream=stream;
   // Start producing frames before play() resolves; otherwise the stream can wait forever.
   setPopupActive(true);
   void video.play().catch(()=>{
    if(stream!==connectedStream)return;
    setPopupActive(false);notify('Click Play in the output window to start it.',true);
   });
  }catch{
   releasePopup();notify('Could not connect the output window. Reopen it to retry.',true);
  }
 }
 window.addEventListener('message',receive);
 function dispose(){
  cancelAnimationFrame(raf);clear();releasePopup();
  window.removeEventListener('message',receive);if(popup&&!popup.closed)popup.close();
 }
 return {connect,show,clear,strobe,openPopup,dispose,
  blackout(value){killed=Boolean(value);},
  disconnect(view){view.engine.onFrame=null;},
 };
}

// Cache the fully rendered first frame during preparation. A cue can show it
// immediately while the existing decoder seeks, without constructing any GPU state.
export async function prepareClipCue(engine, view) {
 const video=engine.video;
 video.pause();
 if(video.currentTime!==0 || video.seeking){
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(Error('Could not cue the video.')),10000);
   const finish=error=>{clearTimeout(timer);video.removeEventListener('seeked',ready);video.removeEventListener('error',failed);error?reject(error):resolve();};
   const ready=()=>finish(), failed=()=>finish(Error('Could not cue the video.'));
   video.addEventListener('seeked',ready,{once:true});video.addEventListener('error',failed,{once:true});video.currentTime=0;
  });
 }
 engine.reset();engine.captureFrame();
 if(!view.ready)throw Error('Could not prepare the first frame.');
 const first=document.createElement('canvas');first.width=view.buffer.width;first.height=view.buffer.height;
 first.getContext('2d').drawImage(view.buffer,0,0);
 engine.setActive(false);await video.play();
 return {
  trigger(settings){
   // cue changes only existing renderer state; no network or GPU initialization.
   const playing=engine.cue(settings);
   view.buffer.getContext('2d').drawImage(first,0,0);view.ready=true;
   return playing;
  },
 };
}
