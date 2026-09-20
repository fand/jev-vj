import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
const {outputFiles} = await build({entryPoints:['effects/twitch-motion.ts'],bundle:true,format:'esm',write:false});
const {sampleMotion,sampleShutter,gate,noiseRate,channels} = await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const catalog = JSON.parse(await readFile('effects/controls.json','utf8'));
const defaults = Object.fromEntries(catalog.find(e=>e.id==='twitch').controls.map(c=>[c.key,c.value]));
const sample = (time,p=defaults) => Object.fromEntries(Object.entries(sampleMotion(channels.map(c=>time*noiseRate(p[c+'Freq'])),p)).map(([k,v])=>[k,v+0]));
test('deterministic seeded noise and zero frequencies',()=>{
    for(let t=0;t<10;t+=.03) assert.deepEqual(sample(t),sample(t));
    assert.notDeepEqual(Array.from({length:100},(_,i)=>sample(i*.1)),Array.from({length:100},(_,i)=>sample(i*.1,{...defaults,seed:9})));
    const off={...defaults,...Object.fromEntries(channels.map(c=>[c+'Freq',0]))};
    for(let t=0;t<10;t+=.03) assert.deepEqual(sample(t,off),{x:0,y:0,scale:1,rgbX:0,rgbY:0,light:1});
});
test('higher frequency increases irregular threshold crossings',()=>{
    function events(f) {
        let was=false; const times=[];
        for(let i=0;i<120*240;i++) {
            const t=i/240,active=gate(t*noiseRate(f),f,1,10,.65)>0;
            if(active&&!was)times.push(t);
            was=active;
        }
        return times;
    }
    const low=events(.2),high=events(.8);
    assert.ok(low.length>5);
    assert.ok(high.length>low.length*4);
    const intervals=high.slice(1).map((t,i)=>Math.round((t-high[i])*100));
    assert.ok(new Set(intervals).size>10, 'events must not form a fixed clock');
});
test('position, scale, RGB and light operate independently',()=>{
    const keys=[['x','y'],['scale'],['rgbX','rgbY'],['light']];
    const identity={x:0,y:0,scale:1,rgbX:0,rgbY:0,light:1};
    for(let c=0;c<channels.length;c++) {
        const p={...defaults,...Object.fromEntries(channels.map((name,i)=>[name+'Freq',i === c ? .7 : 0]))};
        let changed=false;
        for(let i=0;i<300;i++) {
            const actual=sample(i/30,p);
            for(const key of Object.keys(identity)) {
                if(keys[c].includes(key))changed ||= actual[key]!==identity[key];
                else assert.equal(actual[key],identity[key]);
            }
        }
        assert.ok(changed,channels[c]+' should activate independently');
    }
});

test('global zero and zero amounts keep the original image',()=>{
    const identity={x:0,y:0,scale:1,rgbX:0,rgbY:0,light:1};
    for (const p of [{...defaults,global:0}, {...defaults,posX:0,posY:0,scaleAmount:0,rgbAmount:0,lightAmount:0,blurAmount:0}]) {
        for(let t=0;t<10;t+=.07) assert.deepEqual(sample(t,p),identity);
    }
});

test('position frequency increases motion speed while the gate is fully open',()=>{
    function activeSpeed(freq) {
        const p={...defaults,posFreq:freq},dt=1/1000;
        let distance=0,count=0;
        for(let t=0;t<120;t+=dt) {
            const phase=t*noiseRate(freq),next=(t+dt)*noiseRate(freq);
            if(gate(phase,freq,p.seed,10,p.threshold)<.999 || gate(next,freq,p.seed,10,p.threshold)<.999)continue;
            const a=sample(t,p),b=sample(t+dt,p);
            distance+=Math.hypot(b.x-a.x,b.y-a.y)/dt;count++;
        }
        assert.ok(count>100);
        return distance/count;
    }
    assert.ok(activeSpeed(.8)>activeSpeed(.2)*4, 'motion within bursts must speed up, not just burst onsets');
});
test('blur always samples Pos/Scale while preserving instantaneous RGB/Light',()=>{
    const p={...defaults,blurAmount:1};
    for(let t=0;t<10;t+=.031) {
        const phases=channels.map(c=>t*noiseRate(p[c+'Freq']));
        const result=sampleShutter(phases,p);
        assert.equal(result.poses.length,16); // No random blur gating.
        assert.deepEqual(result.current,sampleMotion(phases,p));
        assert.deepEqual(result.current,sampleShutter(phases,{...p,blurAmount:0}).current);
        assert.equal(sampleShutter(phases,{...p,blurAmount:0}).poses.length,1);
    }
    const phases=[5,5,5,5];
    assert.equal(sampleShutter(phases,{...p,posFreq:0,scaleFreq:0}).poses.length,1);
});
