import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./player.js',import.meta.url),'utf8');
function tempo(){
 const context=vm.createContext();
 vm.runInContext(source.slice(source.indexOf('let tapTimes = [];'),source.indexOf("$('tap-tempo').addEventListener")),context);
 return now=>vm.runInContext(`tapTempo(${now})`,context);
}
test('four taps establish BPM; only the latest three intervals are averaged',()=>{
 const tap=tempo();
 assert.equal(tap(0),null);assert.equal(tap(500),null);assert.equal(tap(1010),null);
 assert.equal(tap(1490),121);assert.equal(tap(2000),120);
 assert.equal(tap(2400),129);assert.equal(tap(2800),137);assert.equal(tap(3200),150);
});
test('only taps within five seconds count, including the boundary; double clicks are ignored',()=>{
 const tap=tempo();
 tap(0);tap(1000);tap(3000);assert.equal(tap(5000),36);
 assert.equal(tap(5040),null); // Oldest tap has expired; accidental click is ignored.
 assert.equal(tap(5500),40);
 assert.equal(tap(11000),null);assert.equal(tap(11500),null);
 assert.equal(tap(12000),null);assert.equal(tap(12500),120);
 assert.equal(tap(12540),120);
});

test('source tempo preserves decimals and unannotated footage stays at original speed',()=>{
 const context=vm.createContext();
 vm.runInContext(source.slice(source.indexOf('let tapTimes = [];'),source.indexOf("$('tap-tempo').addEventListener")),context);
 const rate=(a,b)=>vm.runInContext(`sourcePlaybackRate(${JSON.stringify(a)},${JSON.stringify(b)})`,context);
 assert.equal(rate(120,150),1.25);
 assert.equal(rate(180,120),2/3);
 assert.ok(Math.abs(rate(158.52,150)-150/158.52)<1e-12);
 for(const missing of [null,0,-1,'120'])assert.equal(rate(missing,150),1);
 assert.equal(rate(120,null),1);
});
test('Tap updates current and preview rates without seeking; metadata and clip switches reapply the rate',()=>{
 const labels={};
 for(const id of ['bpm','clip-tempo','tap-tempo','resync-tempo','bpm-input']){
  labels[id]={hidden:id==='bpm-input',events:{},value:'',
   addEventListener(name,fn){this.events[name]=fn;},focus(){},select(){},reportValidity(){return true;}};
 }
 const click=()=>labels['tap-tempo'].events.click();
 const frames=[];
 let now=0;
 const context=vm.createContext({$:id=>labels[id],performance:{now:()=>now},
  document:{querySelectorAll:()=>frames}});
 vm.runInContext(source.slice(source.indexOf('let tapTimes = [];'),source.indexOf('const output =')),context);
 function media(id){
  const label={};
  const frame={id,closest:()=>({querySelector:()=>label})};
  const events={};
  const video={dataset:{},currentTime:3,readyState:1,ownerDocument:{defaultView:{frameElement:frame}},
   removeEventListener(){},addEventListener:(name,fn)=>{events[name]=fn;}};
  frame.contentDocument={querySelector:()=>video};frames.push(frame);return {video,events};
 }
 const current=media('output'),preview=media('preview');
 context.mainVideo=current.video;context.previewVideo=preview.video;
 vm.runInContext('bindVideoTempo(mainVideo,120);bindVideoTempo(previewVideo,180)',context);
 click();now=400;click();now=800;click();now=1200;click();
 assert.equal(labels.bpm.textContent,'150');
 assert.equal(current.video.playbackRate,1.25);
 assert.equal(preview.video.playbackRate,150/180);
 assert.equal(current.video.currentTime,3);
 current.video.playbackRate=1;
 current.events.loadedmetadata({currentTarget:current.video});
 assert.equal(current.video.playbackRate,1.25);
 vm.runInContext('bindVideoTempo(mainVideo,null)',context);
 assert.equal(current.video.playbackRate,1);
 assert.equal(current.video.defaultPlaybackRate,1);
 const late=media('preview');context.lateVideo=late.video;
 vm.runInContext('bindVideoTempo(lateVideo,158.52)',context);
 assert.equal(late.video.playbackRate,150/158.52);
 now=10000;click();assert.equal(labels.bpm.textContent,'150');
 assert.equal(preview.video.playbackRate,150/180);
 // Manual entry applies decimals without seeking, clears prior taps, and cancels cleanly.
 labels.bpm.events.dblclick();assert.equal(labels['bpm-input'].hidden,false);
 labels['bpm-input'].value='158.52';labels['bpm-input'].events.blur();
 assert.equal(labels.bpm.textContent,'158.52');assert.equal(preview.video.playbackRate,158.52/180);
 assert.equal(preview.video.currentTime,3);
 labels.bpm.events.dblclick();labels['bpm-input'].value='200';
 labels['bpm-input'].events.keydown({key:'Escape',preventDefault(){}});
 labels['bpm-input'].events.blur();assert.equal(labels.bpm.textContent,'158.52');
 for(const value of ['', '0', '-10', 'Infinity', 'bad']){
  labels.bpm.events.dblclick();labels['bpm-input'].value=value;labels['bpm-input'].events.blur();
  assert.equal(labels.bpm.textContent,'158.52');
 }
 labels.bpm.events.dblclick();labels['bpm-input'].value='130';
 labels['bpm-input'].events.keydown({key:'Enter',preventDefault(){}});
 assert.equal(labels.bpm.textContent,'130');
 now=10400;click();now=10800;click();now=11200;click();
 assert.equal(labels.bpm.textContent,'130'); // Manual edit discarded the old tap.
 now=11600;click();assert.equal(labels.bpm.textContent,'150');
 // Resync seeks all loaded footage, preserves tempo and skips unready previews.
 late.video.readyState=0;
 labels['resync-tempo'].events.click();
 assert.equal(current.video.currentTime,0);assert.equal(preview.video.currentTime,0);
 assert.equal(late.video.currentTime,3);assert.equal(labels.bpm.textContent,'150');
 assert.equal(preview.video.playbackRate,150/180);
});
