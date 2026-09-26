import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {performanceAction,transitionDuration,transitionProgress} from './performance-controls.js';
import {createDeckOutput} from './deck-output.js';

test('performance shortcuts respect editing, IME, modifiers, and held-key repeats',()=>{
 const event=(code,key,other={})=>({code,key,...other});
 for(let n=1;n<=4;n++){
  assert.deepEqual(performanceAction(event('Digit'+n,String(n))),{type:'choose',index:n-1,transition:undefined});
  assert.deepEqual(performanceAction(event('Digit'+n,'!',{shiftKey:true})),{type:'choose',index:n-1,transition:true});
 }
 assert.equal(performanceAction(event('Digit8','8'),true),null);
 assert.equal(performanceAction(event('Space',' '),true),null);
 assert.deepEqual(performanceAction(event('Escape','Escape'),true),{type:'blur'});
 for(const modifier of ['ctrlKey','metaKey','altKey','isComposing','repeat'])assert.equal(performanceAction(event('Digit1','1',{[modifier]:true})),null);
 assert.deepEqual(performanceAction(event('Digit0','0')),{type:'kill'});
 assert.deepEqual(performanceAction(event('Digit8','8')),{type:'strobe',white:true});
 assert.deepEqual(performanceAction(event('Digit9','9')),{type:'strobe',white:false});
 assert.deepEqual(performanceAction(event('Space',' ')),{type:'focus'});
 assert.deepEqual(performanceAction(event('Equal','+')),{type:'duration',delta:.05});
 assert.deepEqual(performanceAction(event('Minus','-')),{type:'duration',delta:-.05});
 assert.equal(transitionDuration(-1),0);assert.equal(transitionDuration(4),1);
 assert.equal(transitionProgress(1500,1000,1),.5);assert.equal(transitionProgress(2000,1000,0),1);
});

test('compositor crossfades two live sources; blackout and held strobes preserve the program',async()=>{
 const originals={};for(const key of ['document','window','requestAnimationFrame','cancelAnimationFrame','devicePixelRatio'])originals[key]=Object.getOwnPropertyDescriptor(globalThis,key);
 let tick, draws=[];
 function canvas(){
  const c={width:10,height:10,dataset:{},getBoundingClientRect:()=>({width:100,height:100})};
  c.ctx={globalAlpha:1,fillStyle:'',fillRect(){draws.push(['fill',this.fillStyle]);},drawImage(source){draws.push(['draw',source,this.globalAlpha]);}};
  c.getContext=()=>c.ctx;return c;
 }
 try{
  Object.assign(globalThis,{document:{createElement:canvas},window:{addEventListener(){},removeEventListener(){}},devicePixelRatio:1,
   requestAnimationFrame(fn){tick=fn;return 1;},cancelAnimationFrame(){}});
  const output=canvas(), program=createDeckOutput(output,()=>{},()=>{});
  const a=program.connect({captureFrame(){}}), b=program.connect({captureFrame(){}});
  a.engine.onFrame({width:100,height:100});b.engine.onFrame({width:100,height:100});
  await program.show(a);const start=performance.now();const fade=program.show(b,1);
  draws=[];tick(start+500);
  const images=draws.filter(d=>d[0]==='draw');
  assert.equal(images[0][1],a.buffer);assert.equal(images[1][1],b.buffer);
  assert.ok(Math.abs(images[1][2]-.5)<.03);assert.equal(output.dataset.transition,'running');
  program.blackout(true);draws=[];tick(start+600);assert.deepEqual(draws.at(-1),['fill','#000']);
  program.blackout(false);program.strobe(true);draws=[];tick(performance.now());assert.deepEqual(draws.at(-1),['fill','#fff']);
  program.strobe(false);draws=[];tick(performance.now());assert.deepEqual(draws.at(-1),['fill','#000']);
  program.strobe(null);draws=[];tick(start+1100);await fade;
  assert.equal(output.dataset.transition,'idle');assert.equal(output.dataset.strobe,'off');
  draws=[];tick(start+1200);assert.equal(draws.filter(d=>d[0]==='draw').length,1);
  program.blackout(true);await program.show(a);draws=[];tick(start+1250);
  assert.deepEqual(draws.at(-1),['fill','#000']);
  await program.show(b);draws=[];tick(start+1260);
  assert.equal(draws.find(d=>d[0]==='draw')[1],b.buffer);
  assert.deepEqual(draws.at(-1),['fill','#000']);
  program.blackout(false);draws=[];tick(start+1270);
  assert.equal(draws.at(-1)[1],b.buffer);assert.equal(output.dataset.blackout,'false');
  program.clear();draws=[];tick(start+1300);assert.equal(draws.filter(d=>d[0]==='draw').length,0);
  program.dispose();
 }finally{for(const [key,desc] of Object.entries(originals))if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}
});


test('0 down → candidate → 0 up: cue while blacked out; release only restores master output',()=>{
 const source=readFileSync(new URL('./player.js',import.meta.url),'utf8');
 let black=false, chosen=0, strobe=null;const listeners={},elements=new Map();
 const $=id=>{
  if(!elements.has(id))elements.set(id,{listeners:{},attrs:{},status:{},
   addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(key,value){this.attrs[key]=value;},
   setPointerCapture(){},querySelector(){return this.status;},classList:{toggle(){}},querySelectorAll:()=>[{disabled:false}]});
  return elements.get(id);
 };
 const context={performanceAction,transitionDuration,Set,
  $,window:{addEventListener:(type,fn)=>{listeners[type]=fn;}},
  document:{addEventListener(){}},program:{blackout:value=>{black=value;},strobe:value=>{strobe=value;}},
  candidates:[{id:'next'}],choose:()=>{chosen++;},
 };
 vm.runInNewContext(source.slice(source.indexOf('let fadeSeconds='),source.indexOf('let token,')),context);
 const key=(code,extra={})=>({code,key:code.slice(-1),preventDefault(){},...extra});
 listeners.keydown(key('Digit0'));assert.equal(black,true);
 listeners.keydown(key('Digit1'));assert.equal(chosen,1);assert.equal(black,true);
 listeners.keyup(key('Digit1'));assert.equal(black,true);
 listeners.keydown(key('Digit0',{repeat:true}));assert.equal(black,true);
 listeners.keyup(key('Digit0'));assert.equal(black,false);assert.equal(chosen,1);
 listeners.keydown(key('Digit0'));listeners.keydown(key('Numpad0'));
 listeners.keyup(key('Digit0'));assert.equal(black,true);
 listeners.keyup(key('Numpad0'));assert.equal(black,false);
 listeners.keydown(key('Digit0'));listeners.blur();assert.equal(black,false);
 listeners.keydown(key('Digit0',{target:{closest:()=>true}}));assert.equal(black,false);
 const active=id=>$(id).attrs['aria-pressed'];
 listeners.keydown(key('Digit8'));assert.equal(active('strobe-white'),'true');assert.equal($('strobe-white').status.textContent,'ON');
 listeners.keydown(key('Digit9'));assert.equal(active('strobe-white'),'false');assert.equal(active('strobe-black'),'true');
 listeners.keyup(key('Digit9'));assert.equal(strobe,true);assert.equal(active('strobe-white'),'true');
 const pointer={button:0,pointerId:42,preventDefault(){}};
 $('master-kill').listeners.pointerdown(pointer);assert.equal(black,true);assert.equal(active('master-kill'),'true');
 listeners.keydown(key('Digit0'));
 $('master-kill').listeners.lostpointercapture(pointer);assert.equal(black,true);
 listeners.keyup(key('Digit0'));assert.equal(black,false);assert.equal(active('master-kill'),'false');
 $('strobe-black').listeners.pointerdown(pointer);assert.equal(strobe,false);
 $('strobe-black').listeners.pointercancel(pointer);assert.equal(strobe,true);
 listeners.blur();assert.equal(strobe,null);assert.equal(active('strobe-white'),'false');
 const enter=key('Enter',{stopPropagation(){}});
 $('master-kill').listeners.keydown(enter);assert.equal(black,true);
 $('master-kill').listeners.blur();assert.equal(black,false);

});

test('popup renders only offscreen; pause, close, reload and autoplay failure restore the deck',async()=>{
 const originals={};for(const key of ['document','window','location','requestAnimationFrame','cancelAnimationFrame'])originals[key]=Object.getOwnPropertyDescriptor(globalThis,key);
 const listeners={},surfaces=[],messages=[],states=[];let tick,popup,denyPlay=false,blocked=false,notices=[];
 function makeCanvas(){
  const surface={width:10,height:10,dataset:{},draws:[],stopped:0};
  const context={globalAlpha:1,fillStyle:'',fillRect(){surface.draws.push(['fill',this.fillStyle]);},drawImage(source){surface.draws.push(['draw',source,this.globalAlpha]);}};
  surface.getContext=()=>context;
  surface.captureStream=()=>({getTracks:()=>[{stop(){surface.stopped++;}}]});
  surfaces.push(surface);return surface;
 }
 function open(){
  if(blocked)return null;
  const video={play:()=>denyPlay?Promise.reject(Error('autoplay denied')):Promise.resolve()};
  return popup={closed:false,focus(){},close(){this.closed=true;},document:{querySelector:()=>video}};
 }
 try{
  Object.assign(globalThis,{document:{createElement:makeCanvas},location:{origin:'http://localhost'},
   window:{open,addEventListener(type,fn){listeners[type]=fn;},removeEventListener(type){delete listeners[type];}},
   requestAnimationFrame(fn){tick=fn;return 1;},cancelAnimationFrame(){}});
  const canvas=makeCanvas(),program=createDeckOutput(canvas,(...args)=>notices.push(args),event=>messages.push(event),active=>states.push(active));
  const offscreen=surfaces[1];
  const a=program.connect({captureFrame(){}}),b=program.connect({captureFrame(){}});
  a.engine.onFrame({width:1280,height:720});b.engine.onFrame({width:1280,height:720});
  await program.show(a);tick(0);
  const send=type=>listeners.message({origin:location.origin,source:popup,data:{type}});
  program.openPopup();tick(1);assert.equal(states.length,0); // Keep the deck visible until handshake.
  listeners.message({origin:'https://other.example',source:popup,data:{type:'output-ready'}});
  assert.equal(states.length,0);
  send('output-ready');assert.deepEqual(states,[true]);
  const frozenDrawCount=canvas.draws.length;
  const start=performance.now(),fade=program.show(b,.5);
  tick(start+250);
  assert.equal(canvas.draws.length,frozenDrawCount);
  assert.equal(offscreen.draws.at(-1)[1],b.buffer);
  assert.ok(Math.abs(offscreen.draws.at(-1)[2]-.5)<.03);
  program.blackout(true);tick(start+300);assert.deepEqual(offscreen.draws.at(-1),['fill','#000']);
  program.blackout(false);program.strobe(true);tick(performance.now());assert.deepEqual(offscreen.draws.at(-1),['fill','#fff']);
  program.strobe(null);tick(start+600);await fade;
  assert.equal(canvas.draws.length,frozenDrawCount);
  send('output-paused');tick(start+700);assert.equal(canvas.draws.at(-1)[1],b.buffer);
  send('output-playing');const pausedDrawCount=canvas.draws.length;tick(start+800);
  assert.equal(canvas.draws.length,pausedDrawCount);
  popup.closed=true;tick(start+900);assert.equal(states.at(-1),false);assert.equal(offscreen.stopped,1);
  assert.equal(canvas.draws.at(-1)[1],b.buffer);assert.equal(messages.at(-1).type,'output-blur');
  program.openPopup();send('output-ready');send('output-closed');assert.equal(states.at(-1),false);
  send('output-ready');assert.equal(states.at(-1),true); // Reloading the popup reuses the same WindowProxy.
  send('output-closed');denyPlay=true;send('output-ready');await Promise.resolve();await Promise.resolve();
  assert.equal(states.at(-1),false);tick(start+1000);assert.equal(canvas.draws.at(-1)[1],b.buffer);
  assert.match(notices.at(-1)[0],/Click Play/);
  send('output-playing');assert.equal(states.at(-1),true);
  popup.closed=true;tick(start+1100);blocked=true;program.openPopup();tick(start+1200);
  assert.equal(states.at(-1),false);assert.match(notices.at(-1)[0],/Allow popups/);
  program.dispose();
 }finally{for(const [key,desc] of Object.entries(originals))if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}
});
