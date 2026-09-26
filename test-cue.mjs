import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {prepareClipCue} from './deck-output.js';

const player=readFileSync(new URL('./player.js',import.meta.url),'utf8');
const chooseSource=player.slice(player.indexOf('async function choose('),player.indexOf("$('form').addEventListener"));
function harness(){
 const log=[],pending=[];
 const video={pause(){log.push('pause');}};
 const old={output:{id:'output',remove(){log.push('remove-old');}},renderer:{setActive(){},dispose(){}},video,view:{id:'old'}};
 const frame={id:'',remove(){assert.fail('Prepared renderer must be retained');}};
 const candidate={id:'candidate',clip:{name:'Next'},effects:[]};
 const view={id:'next'};
 const entry={frame,view,candidate,button:{dataset:{ready:'true'}},engine:{video,setActive(){},apply(){log.push('restore-fx');return Promise.resolve();}},cue:{trigger(){log.push('cue');return Promise.resolve();}}};
 const context=vm.createContext({console,Promise,
  output:old.output,renderer:old.renderer,video,currentView:old.view,
  candidate,busy:false,requesting:false,applyingEffects:false,candidatesStale:false,manualTimer:null,generation:0,
  preparedCandidates:new Map([[candidate.id,entry]]),
  $:()=>({querySelectorAll:()=>[{dataset:{id:candidate.id},setAttribute(){}}]}),
  buttons(){},applyVideoTempo(){},showClip(){},syncEffects(){},notice(message){log.push(message);},queueRecommendations(){},
  program:{show(next){log.push(`show:${next.id}`);return Promise.resolve();},disconnect(){log.push('disconnect');}},
  post(path){log.push(path);return new Promise((resolve,reject)=>pending.push({path,resolve,reject}));},
  async refresh(){log.push('refresh');},
  async restorePresentation(){log.push('rollback');},
 });
 vm.runInContext(chooseSource,context);
 return {context,entry,old,log,pending,start:()=>vm.runInContext('choose(candidate)',context)};
}
test('cut displays a warmed renderer before any HTTP response; retains it for repeat cues',async()=>{
 const h=harness(),done=h.start();
 assert.deepEqual(h.log,['cue','show:next']);await new Promise(setImmediate);
 assert.deepEqual(h.log.slice(0,3),['cue','show:next','/api/choose']);
 assert.equal(h.context.output,h.entry.frame);
 assert.equal(h.log.includes('refresh'),false);
 h.pending[0].resolve({ticket:'ticket'});await new Promise(setImmediate);
 assert.equal(h.pending[1].path,'/api/played');h.pending[1].resolve({ok:true});await done;
 assert.ok(h.log.indexOf('refresh')>h.log.indexOf('show:next'));
 assert.equal(h.log.filter(x=>x==='remove-old').length,1);
 const repeated=h.start();await new Promise(setImmediate);assert.equal(h.log.filter(x=>x==='cue').length,2);
 h.pending[2].resolve({ticket:'again'});await new Promise(setImmediate);h.pending[3].resolve({ok:true});await repeated;
 assert.equal(h.context.output,h.entry.frame);assert.equal(h.context.busy,false);
});
test('expired candidate rolls back to the previous renderer without deleting either reusable candidate',async()=>{
 const h=harness();h.context.preparedCandidates.set('old',{frame:h.old.output,engine:{apply:async()=>{}},candidate:{effects:[]},button:{dataset:{}}});
 const done=h.start();await new Promise(setImmediate);h.pending[0].reject(Error('Expired candidate'));await done;
 assert.equal(h.context.output,h.old.output);assert.ok(h.log.includes('rollback'));assert.equal(h.log.includes('remove-old'),false);assert.equal(h.context.busy,false);
});
test('replacing candidates releases standby renderers but keeps the playing renderer alive',()=>{
 const h=harness();let removed=0,paused=0;
 vm.runInContext(player.slice(player.indexOf('function releasePrepared('),player.indexOf('function clearCandidates(')),h.context);
 h.context.live={frame:h.old.output,engine:{video:{pause(){assert.fail('Playing video must survive');}}}};
 vm.runInContext('releasePrepared(live)',h.context);
 h.context.standby={frame:{remove(){removed++;}},view:{},engine:{dispose(){},video:{pause(){paused++;}}}};
 vm.runInContext('releasePrepared(standby)',h.context);assert.equal(removed,1);assert.equal(paused,1);
});
test('cue caches frame zero ahead of time, then restores it synchronously while video play is pending',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'document');
 let seeks=0,resume;const events=new Map();
 const canvas=()=>{const result={width:1280,height:720,content:'frame-zero'};result.getContext=()=>({drawImage(source){result.content=source.content;}});return result;};
 const buffer=canvas(),video={time:3,seeking:false,pause(){},play:()=>Promise.resolve(),
  get currentTime(){return this.time;},set currentTime(value){this.time=value;seeks++;queueMicrotask(()=>events.get('seeked')?.());},
  addEventListener(type,fn){events.set(type,fn);},removeEventListener(type){events.delete(type);}};
 const engine={video,reset(){},captureFrame(){buffer.content='frame-zero';},setActive(){},cue(){video.currentTime=0;return new Promise(resolve=>resume=resolve);}};
 try{
  Object.defineProperty(globalThis,'document',{value:{createElement:canvas},configurable:true});
  const cue=await prepareClipCue(engine,{buffer,ready:true});assert.equal(seeks,1);
  buffer.content='later-preview-frame';const playing=cue.trigger([]);
  assert.equal(buffer.content,'frame-zero');assert.equal(seeks,2);resume();await playing;
 }finally{if(original)Object.defineProperty(globalThis,'document',original);else delete globalThis.document;}
});

 test('failed video start does not confirm playback or add history',async()=>{
  const h=harness();h.entry.cue.trigger=()=>Promise.reject(Error('Playback failed'));
  await h.start();assert.equal(h.pending.length,0);assert.ok(h.log.includes('rollback'));assert.equal(h.context.output,h.old.output);
 });
