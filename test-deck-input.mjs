import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the actual input queue with a fake clock and deferred API responses.
const source=readFileSync(new URL('./player.js',import.meta.url),'utf8');
const queue=source.slice(source.indexOf('function queueRecommendations(){'),source.indexOf('async function waitAsset('));
function harness(){
 let now=0,id=0;
 const timers=new Map(),requests=[],rendered=[];
 const elements=new Map();
 const $=key=>{if(!elements.has(key))elements.set(key,{value:'',textContent:'',setAttribute(){}});return elements.get(key);};
 const context=vm.createContext({$,performance:{now:()=>now},Math,
  setTimeout(fn,delay){timers.set(++id,{at:now+delay,fn});return id;},clearTimeout(id){timers.delete(id);},
  post(path,body){return new Promise((resolve,reject)=>requests.push({path,body,resolve,reject,at:now}));},
  clearCandidates(){},buttons(){},notice(){},renderCandidates(){rendered.push(vm.runInContext('candidates',context));},
 });
 vm.runInContext(`let queued=false,requesting=false,busy=false,applyingEffects=false,composing=false,requestTimer;
 let inputVersion=0,lastRequestAt=0,manualTimer=null,candidates=[];
 const THROTTLE=1000,state={ready:true,available:8,ffmpeg:true};${queue}`,context);
 return {requests,rendered,
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
