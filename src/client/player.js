import {performanceAction, transitionDuration} from './performance-controls.js';
import {createDeckOutput,prepareClipCue} from './deck-output.js';
const $ = id => document.getElementById(id);
// Average the three intervals between the latest four taps within five seconds.
let tapTimes = [];
let targetBpm = 120;
function tapTempo(now) {
 tapTimes=tapTimes.filter(time=>now-time<=5000);
 if(!tapTimes.length || now-tapTimes.at(-1)>=100){
  tapTimes.push(now);
  tapTimes=tapTimes.slice(-4);
 }
 if(tapTimes.length<4)return null;
 return Math.round(180000/(tapTimes[3]-tapTimes[0]));
}
function sourcePlaybackRate(sourceBpm, bpm) {
 if(!Number.isFinite(sourceBpm)||sourceBpm<=0||!Number.isFinite(bpm)||bpm<=0)return 1;
 return Math.max(1/16,Math.min(16,bpm/sourceBpm));
}
function applyVideoTempo(media) {
 const sourceBpm=Number(media.dataset.sourceBpm);
 const rate=sourcePlaybackRate(sourceBpm,targetBpm);
 media.defaultPlaybackRate=rate;
 media.playbackRate=rate;
 const frame=media.ownerDocument.defaultView.frameElement;
 const label=frame?.id==='output'?$('clip-tempo'):(frame?.tempoLabel||frame?.closest('.candidate')?.querySelector('.candidate-tempo'));
 if(label){label.textContent=sourceBpm>0?`${sourceBpm} BPM · ${rate.toFixed(2)}×`:'Original speed · 1×';label.hidden=frame?.id!=='output'&&!(sourceBpm>0);}
}
function bindVideoTempo(media, sourceBpm) {
 media.dataset.sourceBpm=sourceBpm??'';
 media.removeEventListener('loadedmetadata',onVideoMetadata);
 media.addEventListener('loadedmetadata',onVideoMetadata);
 applyVideoTempo(media);
}
function onVideoMetadata(event){applyVideoTempo(event.currentTarget);}
function tempoVideos() {
 return [...document.querySelectorAll('.stage > iframe')]
  .map(frame=>frame.contentDocument?.querySelector('video')).filter(Boolean);
}
function setTargetBpm(bpm) {
 if(!Number.isFinite(bpm)||bpm<=0)return false;
 targetBpm=bpm;$('bpm').textContent=String(bpm);
 for(const media of tempoVideos())applyVideoTempo(media);
 return true;
}
function editBpm() {
 $('bpm').hidden=true;
 const input=$('bpm-input');input.hidden=false;input.value=targetBpm??'';
 input.focus();input.select();
}
function finishBpmEdit(commit) {
 const input=$('bpm-input');if(input.hidden)return;
 if(commit && setTargetBpm(Number(input.value)))tapTimes=[];
 input.hidden=true;$('bpm').hidden=false;
}
$('tap-tempo').addEventListener('click',()=>{
 const bpm=tapTempo(performance.now());
 if(bpm!==null)setTargetBpm(bpm);
});
$('resync-tempo').addEventListener('click',()=>{
 for(const media of tempoVideos())if(media.readyState>=1)media.currentTime=0;
});
$('bpm').addEventListener('dblclick',editBpm);
$('bpm').addEventListener('keydown',event=>{
 if(event.key==='Enter'||event.key===' '){event.preventDefault();editBpm();}
});
$('bpm-input').addEventListener('blur',()=>finishBpmEdit(true));
$('bpm-input').addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();finishBpmEdit(false);$('bpm').focus();}
 if(event.key==='Enter'){
  event.preventDefault();
  if(Number($('bpm-input').value)>0&&$('bpm-input').reportValidity()){
   finishBpmEdit(true);$('bpm').focus();
  }
 }
});
let output = $('output');
function waitRenderer(frame) {
 return new Promise((resolve,reject)=>{
  const existing=frame.contentWindow?.jevRenderer;if(existing){resolve(existing);return;}
  const timeout=setTimeout(()=>{cleanup();reject(Error('Could not start the renderer. Check the dev terminal and reload.'));},20000);
  const listener=e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='effects-ready'){cleanup();resolve(frame.contentWindow.jevRenderer);}};
  function cleanup(){clearTimeout(timeout);window.removeEventListener('message',listener);}
  window.addEventListener('message',listener);
 });
}
let renderer = await waitRenderer(output);
let video = renderer.video;
const program=createDeckOutput($('program-output'),notice,remotePerformance,active=>{
 $('stage').classList.toggle('popup-active',active);
 $('program-output').setAttribute('aria-label',active?'Output is playing in the popup window':'Live program output');
});
let currentView=program.connect(renderer);
void program.show(currentView);
let fadeSeconds=.3, heldStrobes=[];
const heldBlackout=new Set();
function setFadeSeconds(value){fadeSeconds=transitionDuration(value);$('transition-duration').value=fadeSeconds;$('transition-value').textContent=fadeSeconds.toFixed(2)+'s';}
$('transition-duration').addEventListener('input',event=>setFadeSeconds(event.target.value));
$('popup-output').addEventListener('click',()=>program.openPopup());
function updateMasterControls(){
 const strobe=heldStrobes.at(-1)?.white;
 for(const [id,on] of [['strobe-white',strobe===true],['strobe-black',strobe===false],['master-kill',heldBlackout.size>0]]){
  const button=$(id);button.setAttribute('aria-pressed',String(on));button.querySelector('output').textContent=on?'ON':'OFF';
 }
}
function setBlackout(value){program.blackout(value);$('stage').classList.toggle('blacked-out',value);updateMasterControls();}
function holdPerformance(code,action){
 if(action.type==='kill'){heldBlackout.add(code);setBlackout(true);return;}
 heldStrobes=heldStrobes.filter(item=>item.code!==code);heldStrobes.push({code,white:action.white});
 program.strobe(action.white);updateMasterControls();
}
function releasePerformanceKeys(){heldStrobes=[];program.strobe(null);heldBlackout.clear();setBlackout(false);}
function performanceKey(event){
 const target=event.target;
 const editing=target?.isContentEditable||!!target?.closest?.('input,textarea,select');
 const action=performanceAction(event,editing);if(!action)return;
 event.preventDefault?.();
 if(action.type==='blur'){target.blur();return;}
 if(action.type==='focus'){$('prompt').focus();$('prompt').select();return;}
 if(action.type==='duration'){setFadeSeconds(fadeSeconds+action.delta);return;}
 if(action.type==='kill'||action.type==='strobe'){holdPerformance(event.code,action);return;}
 const candidate=candidates[action.index];
 const card=[...$('candidates').querySelectorAll('button')][action.index];
 if(candidate&&card&&!card.disabled)void choose(candidate,action.transition?fadeSeconds:0);
}
function performanceKeyUp(event){
 if(heldBlackout.delete(event.code))setBlackout(heldBlackout.size>0);
 if(!heldStrobes.some(item=>item.code===event.code))return;
 heldStrobes=heldStrobes.filter(item=>item.code!==event.code);
 program.strobe(heldStrobes.length?heldStrobes.at(-1).white:null);updateMasterControls();
}
function remotePerformance(data){
 if(data.type==='output-key')performanceKey(data);
 if(data.type==='output-keyup')performanceKeyUp(data);
 if(data.type==='output-blur')releasePerformanceKeys();
}
for(const [id,action] of [['strobe-white',{type:'strobe',white:true}],['strobe-black',{type:'strobe',white:false}],['master-kill',{type:'kill'}]]){
 const button=$(id);
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  event.preventDefault();button.setPointerCapture(event.pointerId);
  holdPerformance(`pointer:${id}:${event.pointerId}`,action);
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>performanceKeyUp({code:`pointer:${id}:${event.pointerId}`}));
 // Enter/Space on a focused button act like a hold, without opening the prompt.
 for(const type of ['keydown','keyup'])button.addEventListener(type,event=>{
  if(!['Enter','Space'].includes(event.code))return;
  event.preventDefault();event.stopPropagation();
  const code=`button:${id}:${event.code}`;
  if(type==='keyup')performanceKeyUp({code});else if(!event.repeat)holdPerformance(code,action);
 });
 button.addEventListener('blur',()=>{for(const key of ['Enter','Space'])performanceKeyUp({code:`button:${id}:${key}`});});
}
window.addEventListener('keydown',performanceKey);
window.addEventListener('keyup',performanceKeyUp);
window.addEventListener('blur',releasePerformanceKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releasePerformanceKeys();});
window.addEventListener('pagehide',()=>program.dispose());
let token, state, labels={}, busy=false, generation=0;
let manualTimer, applyingEffects=false, effectDraft=[], manualVersion=0;
let inputVersion=0, candidateVersion=0, requesting=false, queued=false, composing=false, requestTimer;
let lastRequestAt=performance.now(), candidates=[];
let candidatePreparation=null, candidatesStale=false;
let preparedCandidates=new Map();
const THROTTLE=1000;
function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
function loading(text){$('loading').hidden=!text;$('loading-text').textContent=text;}
function buttons(){
 $('clear').disabled=busy||applyingEffects;
 for(const el of $('effect-controls').querySelectorAll('input, select'))el.disabled=busy||requesting||applyingEffects;
 $('effects-clear').disabled=busy||requesting||applyingEffects||!state?.current;
 for(const el of $('candidates').querySelectorAll('button'))el.disabled=busy||applyingEffects||requesting||candidatesStale||el.dataset.ready!=='true';
}
async function post(path,data={}){
 const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Jev-Token':token},body:JSON.stringify(data)});
 const body=await res.json();if(!res.ok)throw Error(body.error||'The request failed.');return body;
}
async function refresh(){
 const res=await fetch('/api/status');if(!res.ok)throw Error('Could not connect to the server.');
 state=await res.json();token=state.token;labels=state.labels;
 $('connection').textContent=`${state.available} / ${state.total} footage`;
 $('led').classList.toggle('ready',state.ready&&state.available>0);
 $('comparison-reference').textContent=state.current?`Comparing against: ${state.current.name} + current effects`:'Playback continues while you type. Click a candidate to switch.';
 $('step').textContent=`${String(state.history.length).padStart(2,'0')} / SESSION`;
 $('current-effects').textContent=effectNames(state.effects||[]);
 if(!state.ready)notice('TypeSafe API key is not configured.',true);
 else if(!state.available)notice('Connect your media drive and click Rescan.',true);
 else if(!state.ffmpeg)notice('Video tools are unavailable. Run npm i and restart the dev server.',true);
 renderHistory();buttons();
}
function effectNames(chain){return chain.map(e=>renderer.definitions.find(d=>d.id===e.id)?.name||e.id).join(' + ')||'No FX';}
function renderHistory(){
 $('history-count').textContent=String(state.history.length).padStart(2,'0');
 $('history').replaceChildren(...state.history.slice().reverse().map(event=>{
  const card=document.createElement('article');card.className='history-item';
  const name=document.createElement('strong');name.textContent=event.clip.name;
  const fx=document.createElement('p');fx.textContent=effectNames(event.effects||[]);
  const prompt=document.createElement('p');prompt.textContent=event.prompt;
  card.append(name,fx,prompt);return card;
 }));
}
function showClip(clip){
 $('empty').hidden=true;$('pack').textContent=clip.pack.toUpperCase();$('name').textContent=clip.name;$('description').textContent=clip.note||'';
 const entries=Object.entries(clip.attributes||{});$('attribute-count').textContent=` / ${entries.length}`;
 $('attributes').replaceChildren(...entries.flatMap(([key,value])=>{
  const dt=document.createElement('dt');dt.textContent=labels[key]||key;
  const dd=document.createElement('dd');dd.textContent=Array.isArray(value)?value.join(' / '):String(value);return [dt,dd];
 }));
}
function cancelCandidatePreparation(){
 ++candidateVersion;candidatePreparation?.cancel();candidatePreparation?.element.remove();candidatePreparation=null;
}
function releasePrepared(entry){
 if(entry.frame===output||entry.disposed)return;
 entry.disposed=true;entry.engine?.dispose();
 if(entry.view)program.disconnect(entry.view);
 entry.engine?.video.pause();entry.frame.remove();
}
function clearCandidates(){
 for(const entry of preparedCandidates.values())releasePrepared(entry);preparedCandidates.clear();
 cancelCandidatePreparation();candidatesStale=false;candidates=[];$('candidates').replaceChildren(...Array.from({length:4},(_,i)=>{
  const el=document.createElement('div');el.className='candidate-placeholder';el.textContent=String(i+1).padStart(2,'0');return el;
 }));
}
function queueRecommendations(){
 if(!queued||requesting||busy||applyingEffects||composing||requestTimer)return;
 requestTimer=setTimeout(()=>{requestTimer=null;void recommend();},Math.max(0,THROTTLE-(performance.now()-lastRequestAt)));
}
function inputChanged(){
 ++inputVersion;cancelCandidatePreparation();$('prompt-count').textContent=`${$('prompt').value.length} / 1000`;
 queued=!!$('prompt').value.trim();$('candidate-status').textContent=queued?'Updating candidates from your input…':'Type to see candidates';
 if(!queued){clearTimeout(requestTimer);requestTimer=null;}
 queueRecommendations();
}
async function recommend(){
 if(!queued||requesting||busy||applyingEffects||composing)return;
 if(!state?.ready||!state.available||!state.ffmpeg){queued=false;return;}
 if(manualTimer){clearTimeout(manualTimer);manualTimer=null;await applyManualEffects();queueRecommendations();return;}
 const version=inputVersion,prompt=$('prompt').value.trim();if(!prompt)return;
 requesting=true;candidatesStale=true;queued=false;lastRequestAt=performance.now();buttons();$('candidates').setAttribute('aria-busy','true');$('candidate-status').textContent='Jev is choosing footage and effects…';
 try{
  const result=await post('/api/candidates',{prompt});
  if(version!==inputVersion)return;
  if(!result.candidates.length)throw Error('No playable candidates returned. Previous previews retained.');
  $('candidate-status').textContent='Preparing new previews…';
  if(!await renderCandidates(result.candidates,version))return;
  $('latency').textContent=`${(result.ms/1000).toFixed(2)} s`;$('tokens').textContent=result.usage?.input_tokens?.toLocaleString()||'—';$('model').textContent=result.model||'—';
  $('candidate-status').textContent=`${candidates.length} / 4 clips`;
  notice(candidates.length?'Click a candidate to play.':'No matching candidates. Current playback continues.');
 }catch(error){if(version===inputVersion){$('candidate-status').textContent='Could not load candidates';notice(error.message,true);}}
 finally{requesting=false;$('candidates').setAttribute('aria-busy','false');buttons();queueRecommendations();}
}
async function waitAsset(asset,valid){
 const deadline=Date.now()+330000;
 while(valid()){
  const res=await fetch(`/api/asset/${asset}`),data=await res.json();
  if(!res.ok||data.state==='error')throw Error(data.error||'Could not prepare the video.');
  if(data.state==='ready')return data.url;
  if(Date.now()>deadline)throw Error('Video preparation timed out.');
  await new Promise(resolve=>setTimeout(resolve,700));
 }
 return null;
}
async function renderCandidates(nextCandidates,inputRevision){
 const version=++candidateVersion;
 const previous=$('candidates'),staging=document.createElement('div');
 staging.className='candidates candidate-staging';staging.inert=true;staging.setAttribute('aria-hidden','true');
 previous.parentElement.append(staging);
 const prepared=new Map();
 let cancel;const canceled=new Promise(resolve=>{cancel=()=>{for(const entry of prepared.values())releasePrepared(entry);resolve(false);};});
 const preparation={element:staging,cancel};candidatePreparation=preparation;
 const valid=()=>version===candidateVersion&&inputRevision===inputVersion&&staging.isConnected;
 const tasks=nextCandidates.map(async(candidate,index)=>{
  const button=document.createElement('button');button.type='button';button.className='candidate';button.disabled=true;button.dataset.id=candidate.id;button.setAttribute('aria-pressed','false');
  const preview=document.createElement('div');preview.className='candidate-preview';
  const thumbnail=document.createElement('canvas');thumbnail.width=320;thumbnail.height=180;preview.append(thumbnail);
  const thumbnailContext=thumbnail.getContext('2d',{alpha:false});
  const frame=document.createElement('iframe');frame.title=`Candidate ${index+1}: ${candidate.clip.name}`;frame.className='output-renderer prepared-renderer';frame.src='/effect-output.html?preview=1';frame.allow='autoplay';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');
  // Keep the full-size renderer in one place for its entire lifetime. Moving an
  // iframe between DOM parents reloads it and would discard the warmed GPU state.
  $('stage').prepend(frame);
  const entry={frame,candidate,button};prepared.set(candidate.id,entry);
  const rank=document.createElement('span');rank.className='candidate-rank';rank.textContent=String(index+1).padStart(2,'0');preview.append(rank);
  const name=document.createElement('strong');name.textContent=candidate.clip.name;
  const fx=document.createElement('span');fx.className='candidate-fx';fx.textContent=effectNames(candidate.effects);
  const tempo=document.createElement('span');tempo.className='candidate-tempo';frame.tempoLabel=tempo;
  const status=document.createElement('span');status.className='candidate-state';status.textContent='Preparing clip…';
  button.append(preview,name,fx,tempo,status);button.addEventListener('click',event=>void choose(candidate,event.shiftKey?fadeSeconds:0));
  staging.append(button);
  try{
   const [engine,url]=await Promise.all([waitRenderer(frame),waitAsset(candidate.asset,valid)]);
   if(!valid()||!url)return false;
   entry.engine=engine;
   bindVideoTempo(engine.video,candidate.clip.source_bpm);engine.video.src=url;await engine.video.play();if(!valid())return false;
   await engine.apply(candidate.effects);if(!valid())return false;
   entry.view=program.connect(engine,buffer=>thumbnailContext.drawImage(buffer,0,0,320,180));
   entry.cue=await prepareClipCue(engine,entry.view);if(!valid())return false;
   status.textContent='';status.hidden=true;button.dataset.ready='true';
   return true;
  }catch(error){
   if(valid()){status.textContent='Preview failed';status.hidden=false;button.title=error.message;}
   return false;
  }finally{
   if(!valid()||button.dataset.ready!=='true'){releasePrepared(entry);prepared.delete(candidate.id);}
  }
 });
 try{
  const ready=await Promise.race([Promise.all(tasks),canceled]);
  if(!ready||!valid())return false;
  if(!ready.some(Boolean))throw Error('Could not prepare new previews. Previous previews retained.');
  for(const entry of preparedCandidates.values())releasePrepared(entry);
  preparedCandidates=prepared;
  previous.remove();staging.id='candidates';staging.classList.remove('candidate-staging');staging.inert=false;staging.removeAttribute('aria-hidden');
  candidates=nextCandidates;candidatesStale=false;buttons();return true;
 }finally{
  if(staging.id!=='candidates'){for(const entry of prepared.values())releasePrepared(entry);staging.remove();}
  if(candidatePreparation===preparation)candidatePreparation=null;
 }
}
async function choose(candidate,seconds=0){
 if(busy||requesting||applyingEffects||candidatesStale)return;
 if(manualTimer){clearTimeout(manualTimer);manualTimer=null;await applyManualEffects();return;}
 const next=preparedCandidates.get(candidate.id);if(!next?.cue)return;
 busy=true;const version=++generation;buttons();
 const previous={output,renderer,video,view:currentView};
 let shown=false;
 try{
  // No request, iframe creation, video load or FX initialization on the cue path.
  const playing=next.cue.trigger(candidate.effects||[]);
  output.id='outgoing';next.frame.id='output';
  output=next.frame;renderer=next.engine;video=renderer.video;currentView=next.view;
  applyVideoTempo(video);
  const transition=program.show(currentView,seconds);shown=true;
  showClip(candidate.clip);
  for(const button of $('candidates').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.id===candidate.id));
  // Persist only after the output switch has begun. Keep ticket requests ordered.
  const confirmation=(async()=>{
   await playing;
   const result=await post('/api/choose',{id:candidate.id});
   await post('/api/played',{ticket:result.ticket,effects_failed:false});
  })();
  const completed=await Promise.allSettled([playing,transition,confirmation]);
  const failure=completed.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  if(version!==generation)return;
  await refresh();syncEffects();
  notice(`Playing ${candidate.clip.name}.`);
 }catch(error){
  // A rejected/stale ticket restores the server-confirmed presentation.
  candidatesStale=true;
  for(const button of $('candidates').querySelectorAll('button'))button.setAttribute('aria-pressed','false');
  if(shown){output.id='';output=previous.output;output.id='output';renderer=previous.renderer;video=previous.video;currentView=previous.view;}
  await restorePresentation().catch(()=>{});
  notice(error.message,true);
 }finally{
  // Retain candidate decoders for repeated cues; retire only orphaned outputs.
  for(const item of [previous,{output:next.frame,renderer:next.engine,video:next.engine.video,view:next.view}]){
   if(item.output===output)continue;
   item.output.id='';item.renderer.setActive(false);
   const entry=[...preparedCandidates.values()].find(entry=>entry.frame===item.output);
   if(entry){
    // Manual FX edits affect the playing renderer; restore its candidate preset
    // in the background before making it available for another cue.
    await entry.engine.apply(entry.candidate.effects||[]).catch(()=>{entry.button.dataset.ready='false';});
   }else{program.disconnect(item.view);item.renderer.dispose();item.output.remove();}
  }
  if(version===generation){busy=false;buttons();queueRecommendations();}
 }
}
$('form').addEventListener('submit',e=>e.preventDefault());
$('prompt').addEventListener('input',inputChanged);
$('prompt').addEventListener('compositionstart',()=>{composing=true;clearTimeout(requestTimer);requestTimer=null;});
$('prompt').addEventListener('compositionend',()=>{composing=false;inputChanged();});
$('fullscreen').addEventListener('click',()=>{const change=document.fullscreenElement?document.exitFullscreen():$('stage').requestFullscreen?.();change?.catch(()=>notice('Could not enter fullscreen.',true));});
$('clear').addEventListener('click',async()=>{
 ++generation;++inputVersion;++manualVersion;queued=false;clearTimeout(requestTimer);requestTimer=null;clearTimeout(manualTimer);manualTimer=null;
 busy=true;clearCandidates();buttons();
 try{await post('/api/clear');await restorePresentation();$('prompt').value='';$('prompt-count').textContent='0 / 1000';$('candidate-status').textContent='Type to see candidates';notice('Playback history cleared.');}
 catch(error){notice(error.message,true);}finally{busy=false;loading('');buttons();}
});
$('scan').addEventListener('click',async()=>{try{await post('/api/scan');await refresh();if(state.current)bindVideoTempo(video,state.current.source_bpm);inputChanged();}catch(error){notice(error.message,true);}});
function syncEffects(){effectDraft=structuredClone(state.effects||[]);renderEffectControls();}
function renderEffectControls(){
 $('effects-count').textContent=String(effectDraft.length);
 $('effect-controls').replaceChildren(...renderer.definitions.map(def=>{
  const selected=effectDraft.find(e=>e.id===def.id);
  const card=document.createElement('div');card.className='effect-card'+(selected?' active':'');
  const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=!!selected;
  label.append(check,document.createTextNode(def.name));card.append(label);
  check.addEventListener('change',()=>{
   if(check.checked)effectDraft.push({id:def.id,params:Object.fromEntries(def.controls.map(c=>[c.key,c.value])),mix:1});
   else effectDraft=effectDraft.filter(e=>e.id!==def.id);
   renderEffectControls();queueManualEffects();
  });
  const params=document.createElement('div');params.className='effect-params';
  for(const c of [...def.controls,...(def.id==='trails'?[]:[{key:'$mix',label:'Effect mix',min:0,max:1,step:.01,value:1}])]){
   const row=document.createElement('label'),value=document.createElement('output'),input=document.createElement(c.options?'select':'input');
   if(c.options)c.options.forEach((name,index)=>{const option=document.createElement('option');option.value=index;option.textContent=name;input.append(option);});
   else{input.type='range';input.min=c.min;input.max=c.max;input.step=c.step;}
   input.value=c.key==='$mix'?(selected?.mix??1):(selected?.params[c.key]??c.value);
   input.setAttribute('aria-label',def.name+' '+c.label);value.textContent=c.options?'':input.value;
   input.addEventListener('input',()=>{const item=effectDraft.find(e=>e.id===def.id);if(!item)return;if(c.key==='$mix')item.mix=Number(input.value);else item.params[c.key]=Number(input.value);value.textContent=c.options?'':input.value;queueManualEffects();});
   row.append(document.createTextNode(c.label),value,input);params.append(row);
  }
  card.append(params);return card;
 }));
}
function queueManualEffects(){++manualVersion;clearTimeout(manualTimer);manualTimer=setTimeout(()=>{manualTimer=null;void applyManualEffects();},180);}
async function restorePresentation(){
 await refresh();
 if(state.current){
  bindVideoTempo(video,state.current.source_bpm);
  const src=`/media/${state.current_asset}`;
  if(video.getAttribute('src')!==src){video.src=src;video.load();await video.play().catch(()=>{});}
  await renderer.apply(state.effects||[]).catch(()=>{});void program.show(currentView);showClip(state.current);
 }else{program.clear();video.pause();video.removeAttribute('src');video.load();renderer.reset();$('empty').hidden=false;$('name').textContent='No clip selected';$('pack').textContent='NOW PLAYING';$('description').textContent='';$('attributes').replaceChildren();$('attribute-count').textContent='';$('clip-tempo').textContent='';bindVideoTempo(video,null);}
 syncEffects();
}
async function applyManualEffects(){
 if(busy||requesting||!state.current){syncEffects();$('effects-status').textContent='Start playback and wait for selection to finish before adjusting effects.';return;}
 if(applyingEffects)return;
 applyingEffects=true;buttons();
 let processed=manualVersion;
 try{
  do{
   processed=manualVersion;
   const version=generation,revision=state.effect_revision,clipId=state.current.id;
   const draft=structuredClone(effectDraft);
   const actual=await renderer.apply(draft);
   if(version!==generation){await restorePresentation();return;}
   await post('/api/effects',{effects:actual,clip_id:clipId,revision});
   if(version!==generation){await restorePresentation();return;}
   await refresh();
  }while(processed!==manualVersion);
  syncEffects();$('effects-status').textContent='Manual settings applied. Future prompts will compare against them.';
 }catch(error){notice(error.message,true);await restorePresentation();}
 finally{applyingEffects=false;buttons();queueRecommendations();}
}

$('effects-clear').addEventListener('click',()=>{effectDraft=[];renderEffectControls();queueManualEffects();});
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.data?.type!=='effects-error')return;
 if(e.source!==output.contentWindow){
  for(const entry of preparedCandidates.values())if(e.source===entry.frame.contentWindow){
   const button=entry.button;button.dataset.ready='false';button.disabled=true;
   const status=button.querySelector('.candidate-state');status.textContent='FX preview failed';status.hidden=false;
  }
  return;
 }
 notice('Effect rendering failed. Showing the original footage.',true);
 if(state?.current&&!busy&&!requesting&&!applyingEffects)void post('/api/effects',{effects:[],clip_id:state.current.id,revision:state.effect_revision}).then(refresh).then(syncEffects).catch(()=>{});
});
const libraryChannel=new BroadcastChannel('jev-library');
libraryChannel.addEventListener('message',async event=>{
 if(event.data!=='changed')return;
 ++inputVersion;cancelCandidatePreparation();candidatesStale=true;buttons();
 try{
  await refresh();
  if(state.current)bindVideoTempo(video,state.current.source_bpm);
  $('candidate-status').textContent='Library updated · edit direction to refresh';
  notice('Library updated. Your next suggestions will use the saved descriptions.');
 }catch(error){notice(error.message,true);}
});
clearCandidates();
try{
 await refresh();syncEffects();
 if(state.current){
  const savedPrompt=state.prompt||'';$('prompt').value=savedPrompt;$('prompt-count').textContent=`${savedPrompt.length} / 1000`;
  await restorePresentation();notice('Previous clip resumed. Type to update candidates.');
 }
}catch(error){notice(error.message,true);}
