import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the actual input queue with a fake clock and deferred API responses.
const source=readFileSync(new URL('./player.js',import.meta.url),'utf8');
const queue=source.slice(source.indexOf('function queueRecommendations(){'),source.indexOf('async function waitAsset('));
function harness({deferPreviews=false}={}){
 let now=0,id=0;
 const timers=new Map(),requests=[],rendered=[],preparations=[];
 const elements=new Map();
 const $=key=>{if(!elements.has(key))elements.set(key,{value:'',textContent:'',setAttribute(){}});return elements.get(key);};
 const context=vm.createContext({$,performance:{now:()=>now},Math,
  setTimeout(fn,delay){timers.set(++id,{at:now+delay,fn});return id;},clearTimeout(id){timers.delete(id);},
  post(path,body){return new Promise((resolve,reject)=>requests.push({path,body,resolve,reject,at:now}));},
  cancelCandidatePreparation(){preparations.at(-1)?.resolve(false);},
  clearCandidates(){assert.fail('Typing must retain the visible candidates');},buttons(){},notice(){},
  renderCandidates(clips,version){
   const commit=()=>{context.nextClips=clips;vm.runInContext('candidates=nextClips',context);rendered.push(clips);return true;};
   if(!deferPreviews)return commit();
   return new Promise(resolve=>preparations.push({resolve,finish:()=>resolve(version===vm.runInContext('inputVersion',context)?commit():false)}));
  },
 });
 vm.runInContext(`let queued=false,requesting=false,busy=false,applyingEffects=false,composing=false,requestTimer;
 let inputVersion=0,lastRequestAt=0,manualTimer=null,candidates=[],candidatesStale=false;
 const THROTTLE=1000,state={ready:true,available:8,ffmpeg:true};${queue}`,context);
 return {requests,rendered,preparations,visible:()=>vm.runInContext('candidates',context),
  input(text){$('prompt').value=text;vm.runInContext('inputChanged()',context);},
  composing(value){vm.runInContext('composing='+value,context);},
  async advance(ms){now+=ms;for(const [id,t] of timers)if(t.at<=now){timers.delete(id);t.fn();}await Promise.resolve();},
  async resolve(i,clips){requests[i].resolve({candidates:clips,ms:10});await Promise.resolve();await Promise.resolve();},
 };
}
test('throttle sends latest input, never overlaps, and discards a stale response',async()=>{
 const h=harness();h.input('a');await h.advance(400);h.input('ab');await h.advance(599);
 assert.equal(h.requests.length,0);await h.advance(1);
 assert.equal(h.requests[0].body.prompt,'ab');
 h.input('abc');await h.advance(1000);assert.equal(h.requests.length,1);
 await h.resolve(0,['old']);assert.deepEqual(h.rendered,[]);
 await h.advance(0);assert.equal(h.requests.length,2);assert.equal(h.requests[1].body.prompt,'abc');
 await h.resolve(1,['latest']);assert.deepEqual(h.rendered,[['latest']]);
 assert.ok(h.requests[1].at-h.requests[0].at>=1000);
});
test('empty input and IME composition do not send requests',async()=>{
 const h=harness();h.input('draft');h.input('');await h.advance(1200);assert.equal(h.requests.length,0);
 h.composing(true);h.input('に');await h.advance(1200);assert.equal(h.requests.length,0);
 h.composing(false);h.input('日本');await h.advance(0);assert.equal(h.requests[0].body.prompt,'日本');
 h.input('');await h.resolve(0,['obsolete']);assert.deepEqual(h.rendered,[]);
});

test('visible candidates survive typing and are replaced only after new previews finish',async()=>{
 const h=harness({deferPreviews:true});h.input('first');await h.advance(1000);await h.resolve(0,['first']);
 h.preparations[0].finish();await new Promise(setImmediate);assert.deepEqual(h.visible(),['first']);
 h.input('next');assert.deepEqual(h.visible(),['first']);await h.advance(1000);await h.resolve(1,['next']);
 assert.deepEqual(h.visible(),['first']);h.preparations[1].finish();await new Promise(setImmediate);
 assert.deepEqual(h.visible(),['next']);
 h.input('');assert.deepEqual(h.visible(),['next']);
});
test('typing cancels obsolete preview preparation without clearing or committing it',async()=>{
 const h=harness({deferPreviews:true});h.input('first');await h.advance(1000);await h.resolve(0,['first']);
 h.preparations[0].finish();await new Promise(setImmediate);
 h.input('obsolete');await h.advance(1000);await h.resolve(1,['obsolete']);
 h.input('latest');await new Promise(setImmediate);h.preparations[1].finish();await new Promise(setImmediate);
 assert.deepEqual(h.visible(),['first']);await h.advance(1000);await h.resolve(2,['latest']);
 h.preparations[2].finish();await new Promise(setImmediate);assert.deepEqual(h.rendered,[['first'],['latest']]);
});
