import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['src/effects/shift-glitch.ts'],bundle:true,format:'esm',write:false});
const {definition}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
function harness(params) {
    const instance=definition.create(params); let uniforms;
    const tick=time=>{
        const ctx={time,dims:{elementPixel:[1280,720]},src:{},target:{},draw:call=>{uniforms=call.uniforms;}};
        instance.effect.update(ctx);instance.effect.render(ctx);return uniforms;
    };
    return {instance,tick};
}
test('0–30 Hz clock holds between updates and freezes at zero',()=>{
    const h=harness({frequency:30});
    assert.equal(h.tick(0).eventIndex,0);
    assert.equal(h.tick(.01).eventIndex,0);
    assert.equal(h.tick(.04).eventIndex,1);
    h.instance.setParams({frequency:0});
    assert.equal(h.tick(.08).eventIndex,1);
    assert.equal(h.tick(5).eventIndex,1);
    h.instance.setParams({frequency:30});
    assert.equal(h.tick(5.04).eventIndex,2);
    h.instance.reset();assert.equal(h.tick(6).eventIndex,0);
});
test('independent axis coverage and seed reset',()=>{
    const h=harness({vertical:.2,horizontal:.4,size:72,frequency:30});
    const u=h.tick(0);
    assert.equal(u.vertical,.2);assert.equal(u.horizontal,.4);assert.equal(u.size,72);
    assert.equal(h.tick(.1).eventIndex,3);
    h.instance.setParams({seed:9,vertical:0});
    const next=h.tick(.2);
    assert.equal(next.eventIndex,0);assert.equal(next.seed,9);
    assert.equal(next.vertical,0);assert.equal(next.horizontal,.4);
});
