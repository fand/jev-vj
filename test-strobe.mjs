import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['effects/strobe.ts'],bundle:true,format:'esm',write:false});
const {definition}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
function sample(instance,dt=0){
 let uniforms;
 const ctx={deltaTime:dt,draw:call=>{uniforms=call.uniforms;}};
 instance.effect.update(ctx);instance.effect.render(ctx);return uniforms;
}
test('frequency and duty gate flashes independently of render rate, with phase-continuous edits',()=>{
 const instance=definition.create({frequency:2,duty:.25,amount:.8});
 assert.equal(sample(instance).flash,.8);
 assert.equal(sample(instance,.13).flash,0);
 assert.equal(sample(instance,.37).flash,.8);
 instance.reset();sample(instance,.2);instance.setParams({frequency:4});
 assert.equal(sample(instance).flash,0);
 assert.equal(sample(instance,.16).flash,.8);
 const a=definition.create({frequency:3,duty:.25}),b=definition.create({frequency:3,duty:.25});
 for(let i=0;i<10;i++)sample(a,.017);
 assert.equal(sample(a).flash,sample(b,.17).flash);
});
test('zero frequency, amount, and duty bypass; full duty is constant; mode and reset are deterministic',()=>{
 for(const params of [{frequency:0},{amount:0},{duty:0}]){
  const instance=definition.create(params);
  assert.equal(sample(instance).flash,0);assert.equal(sample(instance,.4).flash,0);
 }
 const instance=definition.create({duty:1,white:1,amount:.6});
 assert.equal(sample(instance,.173).flash,.6);assert.equal(sample(instance).level,1);
 instance.setParams({white:0});assert.equal(sample(instance).level,0);
 instance.setParams({frequency:2,duty:.25});sample(instance,.2);instance.reset();
 assert.equal(sample(instance).flash,.6);
});
