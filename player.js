const $ = id => document.getElementById(id);
const output = $('output');
const renderer = await new Promise((resolve,reject)=>{
 const ready=()=>output.contentWindow?.jevRenderer;
 if(ready()){resolve(ready());return;}
 const timeout=setTimeout(()=>{window.removeEventListener('message',listener);reject(Error('映像エンジンを起動できません。npm run buildを確認してください。'));},20000);
 const listener=e=>{if(e.origin===location.origin&&e.source===output.contentWindow&&e.data?.type==='effects-ready'){clearTimeout(timeout);window.removeEventListener('message',listener);resolve(ready());}};
 window.addEventListener('message',listener);
});
const video = renderer.video;
let manualTimer, applyingEffects=false, effectDraft=[], manualVersion=0, playbackApplying=false;

let token, state, busy = false, generation = 0, timer, ticker, playbackTicket = null;
let activePrompt = '', labels = {};
function notice(text, error=false) { $('notice').textContent=text; $('notice').classList.toggle('error',error); }
function buttons() { const available=state?.ready && state.available>0 && state.ffmpeg; const edited=$('prompt').value.trim()!==activePrompt; $('select').disabled=busy || applyingEffects || !available; $('next').disabled=busy || applyingEffects || !available || !activePrompt || edited; $('next').title=edited?'変更した指示は「映像を選ぶ」で適用します。':'同じ指示で次の映像を選択'; $('cancel').hidden=!(busy||applyingEffects); for(const el of $('effect-controls').querySelectorAll('input'))el.disabled=busy||playbackApplying; $('effects-clear').disabled=busy||playbackApplying; }
function loading(text) { $('loading').hidden=!text; $('loading-text').textContent=text || ''; }
async function post(path,data={}) {
 const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Jev-Token':token},body:JSON.stringify(data)});
 const body=await res.json(); if(!res.ok) throw Error(body.error || '処理に失敗しました。'); return body;
}
async function refresh() {
 const res=await fetch('/api/status'); if(!res.ok)throw Error('サーバーに接続できません。');
 state=await res.json();token=state.token;labels=state.labels;
 $('comparison-reference').textContent=state.current?`比較の基準：${state.current.name}`:'1本目を選ぶと「もっとミニマルに」などで比較できます。';
 $('connection').textContent=`${state.available} / ${state.total} clips · ${state.axis_count} attributes`;
 $('led').classList.toggle('ready',state.ready && state.available>0);
 if(!state.ready)notice('TypeSafe APIキーが未設定です。',true);
 else if(!state.available)notice('T7を接続して「再スキャン」を押してください。',true);
 else if(!state.ffmpeg)notice('動画再生にはffmpeg / ffprobeが必要です。',true);
 renderHistory(); buttons();
}
function renderHistory() {
 $('history-count').textContent=String(state.history.length).padStart(2,'0');
 if(!state.history.length){$('history').replaceChildren(Object.assign(document.createElement('p'),{className:'muted',textContent:'まだ再生履歴はありません。'}));return;}
 $('history').replaceChildren(...state.history.slice().reverse().map((event,index)=>{
  const card=document.createElement('article');card.className='history-item';
  const num=document.createElement('span');num.className='num';num.textContent=`${String(state.history.length-index).padStart(2,'0')} / ${event.clip.pack}`;
  const name=document.createElement('strong');name.textContent=event.clip.name;
  const prompt=document.createElement('p');prompt.textContent=event.prompt;
  const time=document.createElement('small');time.textContent=new Date(event.played_at*1000).toLocaleTimeString('ja-JP');
  card.append(num,name,prompt,time);return card;
 }));
}
function showClip(clip) {
 $('empty').hidden=true;$('pack').textContent=clip.pack.toUpperCase();$('name').textContent=clip.name;$('description').textContent=clip.note;
 const entries=Object.entries(clip.attributes);
 $('attribute-count').textContent=` / ${entries.length}`;
 $('attributes').replaceChildren(...entries.flatMap(([key,value])=>{
  const dt=document.createElement('dt');dt.textContent=labels[key]||key;
  const dd=document.createElement('dd');dd.textContent=Array.isArray(value)?value.join(' / '):String(value);return [dt,dd];
 }));
 const primary=['color.palette','content.setting','camera.translation_speed','motion.rotation_direction','light.speed'];
 $('tags').replaceChildren(...primary.filter(k=>clip.attributes[k]!==undefined).map(k=>{
  const tag=document.createElement('span');const v=clip.attributes[k];tag.textContent=`${labels[k]} · ${Array.isArray(v)?v.join(' / '):v}`;return tag;
 }));
}
function stopTimer() {clearTimeout(timer);clearInterval(ticker);$('countdown').textContent='再生履歴を踏まえて選択します。';}
function schedule() {
 stopTimer();if(!$('auto').checked || !activePrompt || video.paused || busy || applyingEffects || document.hidden)return;
 const seconds=Number($('interval').value), due=Date.now()+seconds*1000;
 const update=()=>{$('countdown').textContent=`あと ${Math.max(0,Math.ceil((due-Date.now())/1000))} 秒で次の選択へ`;};update();ticker=setInterval(update,1000);
 timer=setTimeout(()=>select('next'),seconds*1000);
}
async function select(action='select') {
 const prompt=(action==='next'?activePrompt:$('prompt').value).trim();if(!prompt){$('prompt').focus();return;}
 if(busy||applyingEffects)return;
 if(manualTimer){clearTimeout(manualTimer);manualTimer=null;await applyManualEffects();}
 busy=true;const version=++generation;stopTimer();buttons();loading('Jevが次の映像を選択中');notice('素材の属性と再生履歴を読み取っています…');
 try {
  const result=await post('/api/select',{prompt,action:action==='select'&&$('clip-lock').checked?'effects':action});if(version!==generation)return;
  activePrompt=prompt;
  $('latency').textContent=`${(result.ms/1000).toFixed(2)} s`;
  $('tokens').textContent=result.usage?.input_tokens?.toLocaleString()||'—';$('model').textContent=result.model||'—';
  $('alternatives').replaceChildren(...(result.alternatives||[]).map(a=>Object.assign(document.createElement('p'),{textContent:`${a.name} · ${(a.weight*100).toFixed(1)}%`})));
  if(result.outcome==='effects_updated') {
   if(await applyTicket(result,version))notice('映像を維持してエフェクトを更新しました。');return;
  }
  if(result.outcome!=='selected') {
   notice(result.outcome==='keep'?'今の映像を維持します。': '合う素材が見つかりませんでした。指示を変えてみてください。');
   if(result.outcome==='no_match')$('auto').checked=false;
   return;
  }
  loading('動画を準備中');notice('選択完了。再生用の動画を準備しています…');
  const deadline=Date.now()+330000;
  while(true) {
   if(version!==generation)return;
   const res=await fetch(`/api/asset/${result.asset}`);const asset=await res.json();
   if(!res.ok || asset.state==='error')throw Error(asset.error||'動画を準備できませんでした。');
   if(asset.state==='ready') {
    playbackTicket={result,version};video.src=asset.url;video.load();
    try{await video.play();}catch{notice('再生ボタンを押すと映像が始まります。');}
    break;
   }
   if(Date.now()>deadline)throw Error('動画の準備がタイムアウトしました。');
   await new Promise(resolve=>setTimeout(resolve,700));
  }
 } catch(error) {if(version===generation){notice(error.message,true);$('auto').checked=false;}}
 finally {if(version===generation){busy=false;loading('');buttons();schedule();}}
}
video.addEventListener('playing',async()=>{
 const ticket=playbackTicket;
 if(ticket && ticket.version===generation) {
  playbackTicket=null;
  showClip(ticket.result.clip);
  try {
   if(!await applyTicket(ticket.result,ticket.version))return;
   $('step').textContent=`${String(state.history.length).padStart(2,'0')} / SESSION`;notice(ticket.result.repeat_fallback?'他に合う候補がないため、最近の素材を再使用しています。':'再生中。直近3本を避けて「次の1本」へ進めます。');
  }catch(error){notice(error.message,true);$('auto').checked=false;}
 }
 schedule();
});
video.addEventListener('pause',stopTimer);
video.addEventListener('error',()=>{if(video.getAttribute('src')){playbackTicket=null;notice('動画を再生できませんでした。履歴には追加しません。',true);$('auto').checked=false;stopTimer();}});
$('form').addEventListener('submit',e=>{e.preventDefault();select();});
$('next').addEventListener('click',()=>select('next'));
$('prompt').addEventListener('input',()=>{$('prompt-count').textContent=`${$('prompt').value.length} / 1000`;if($('auto').checked){$('auto').checked=false;stopTimer();}buttons();});
for(const b of $('examples').querySelectorAll('button'))b.addEventListener('click',()=>{$('prompt').value=b.textContent;$('prompt').dispatchEvent(new Event('input'));$('prompt').focus();});
$('auto').addEventListener('change',schedule);$('interval').addEventListener('change',schedule);
document.addEventListener('visibilitychange',()=>document.hidden?stopTimer():schedule());
$('fullscreen').addEventListener('click',()=>{const change=document.fullscreenElement?document.exitFullscreen():$('stage').requestFullscreen?.();change?.catch(()=>notice('全画面表示を切り替えられませんでした。',true));});
async function cancel(clear=false) {
 ++generation;++manualVersion;clearTimeout(manualTimer);manualTimer=null;busy=false;playbackTicket=null;$('auto').checked=false;stopTimer();loading('');buttons();
 try{await post(clear?'/api/clear':'/api/cancel');if(clear){activePrompt='';video.pause();video.removeAttribute('src');video.load();renderer.reset();effectDraft=[];renderEffectControls();$('empty').hidden=false;$('name').textContent='まだ選択されていません';$('pack').textContent='NOW PLAYING';$('step').textContent='— / SESSION';$('description').textContent='新しい流れを始めましょう。';$('tags').replaceChildren();$('attributes').replaceChildren();$('attribute-count').textContent='';}await restorePresentation();notice(clear?'履歴をクリアしました。':'待機中の選択を取り消しました。');}catch(e){notice(e.message,true);}
}
$('cancel').addEventListener('click',()=>cancel());$('clear').addEventListener('click',()=>cancel(true));
$('scan').addEventListener('click',async()=>{try{$('scan').disabled=true;await post('/api/scan');await refresh();}catch(e){notice(e.message,true);}finally{$('scan').disabled=false;}});
async function initialize() {
 await refresh();renderEffectControls();
 if(state.current) {
  const last=state.history.at(-1);
  activePrompt=state.prompt??last?.prompt??'';$('prompt').value=activePrompt;$('prompt-count').textContent=`${activePrompt.length} / 1000`;
  video.addEventListener('loadeddata',()=>{void renderer.apply(state.effects||[]).then(syncEffects).catch(e=>notice(e.message,true));},{once:true});
  showClip(state.current);$('step').textContent=`${String(state.history.length).padStart(2,'0')} / SESSION`;
  video.src=`/media/${state.current_asset??last?.asset}`;
  try{await video.play();notice('前回の映像を再開しました。');}catch{notice('再生ボタンで前回の映像を再開できます。');}
  buttons();
 }
}
initialize().catch(e=>notice(e.message,true));

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
  for(const c of [...def.controls,{key:'$mix',label:'Effect mix',min:0,max:1,step:.01,value:1}]){
   const row=document.createElement('label'),value=document.createElement('output'),input=document.createElement('input');
   input.type='range';input.min=c.min;input.max=c.max;input.step=c.step;input.value=c.key==='$mix'?(selected?.mix??1):(selected?.params[c.key]??c.value);
   input.setAttribute('aria-label',def.name+' '+c.label);value.textContent=input.value;
   input.addEventListener('input',()=>{const item=effectDraft.find(e=>e.id===def.id);if(!item)return;if(c.key==='$mix')item.mix=Number(input.value);else item.params[c.key]=Number(input.value);value.textContent=input.value;queueManualEffects();});
   row.append(document.createTextNode(c.label),value,input);params.append(row);
  }
  card.append(params);return card;
 }));
}
function queueManualEffects(){++manualVersion;clearTimeout(manualTimer);manualTimer=setTimeout(()=>{manualTimer=null;void applyManualEffects();},180);}
async function restorePresentation(){
 await refresh();
 if(state.current){
  const src=`/media/${state.current_asset}`;
  if(video.getAttribute('src')!==src){video.src=src;video.load();await video.play().catch(()=>{});}
  await renderer.apply(state.effects||[]).catch(()=>{});showClip(state.current);
 }else{video.pause();video.removeAttribute('src');video.load();renderer.reset();$('empty').hidden=false;}
 syncEffects();
}
async function applyTicket(result,version){
 applyingEffects=true;playbackApplying=true;buttons();let failed=false;
 try{
  try{await renderer.apply(result.effects||[]);}catch{failed=true;}
  if(version!==generation){await restorePresentation();return false;}
  await post('/api/played',{ticket:result.ticket,effects_failed:failed});
  if(version!==generation){await restorePresentation();return false;}
  await refresh();syncEffects();
  if(failed){notice('エフェクト描画に失敗したため元映像で再生しています。',true);$('auto').checked=false;return false;}
  return true;
 }catch(error){await restorePresentation();throw error;}
 finally{applyingEffects=false;playbackApplying=false;buttons();}
}
async function applyManualEffects(){
 if(busy||!state.current){syncEffects();$('effects-status').textContent='映像の再生後、選択処理が終わってから調整してください。';return;}
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
  syncEffects();$('effects-status').textContent='手動設定を適用しました。次の指示でも比較に使います。';
 }catch(error){notice(error.message,true);await restorePresentation();}
 finally{applyingEffects=false;buttons();}
}
$('effects-clear').addEventListener('click',()=>{effectDraft=[];renderEffectControls();queueManualEffects();});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===output.contentWindow&&e.data?.type==='effects-error'){notice('エフェクト描画に失敗したため元映像を表示しています。',true);$('auto').checked=false;stopTimer();if(state?.current&&!busy&&!applyingEffects){void post('/api/effects',{effects:[],clip_id:state.current.id,revision:state.effect_revision}).then(refresh).then(syncEffects).catch(()=>{});}}});
