import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync, rmSync, realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {get} from 'node:http';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {setTimeout as delay} from 'node:timers/promises';
import {FootageStore, CORE, videoFiles} from '../src/server/footage-store.mjs';
import {Library, videoTools, parseSourceBpms} from '../src/server/library.mjs';
import {Player, evaluate, footageRequest} from '../src/server/player.mjs';
import {controls, presets, validateChain, effectRequest, selectEffects} from '../src/server/effects.mjs';
import {createPlayerServer, byteRange} from '../src/server/http.mjs';
const run = promisify(execFile);
function fixture(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(),'jev-node-')));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const media = join(dir,'videos'); mkdirSync(media);
  const library = new Library({cache:join(dir,'cache'),dataDir:join(dir,'.library')});
  return {dir,media,library};
}
const effectsOff = body => ({answers:Object.fromEntries(Object.keys(body.questions).map(id=>[id,{type:'choice',choice:'off'}])),usage:{input_tokens:10}});
function fakeLibrary() {
  const ids = 'abcdef'.split('').map(c=>`pack/${c}.mp4`);
  return {clips:ids.map(id=>({id,description:id,attributes:{}})),axes:{},available:()=>ids,public:id=>({id,name:id,source_bpm:120}),prepare:id=>id,job:()=>({state:'ready'})};
}
function playerFixture(options = {}) {
  return new Player(fakeLibrary(),{
    evaluator:body=>({answers:{clip:{type:'choice',choice:body.state.candidate_ids.at(-1),probabilities:Object.fromEntries([...body.state.candidate_ids.map((id,i)=>[id,(i+1)/30]),['unknown',.99]])}},usage:{input_tokens:100}}),
    effectEvaluator:effectsOff,
    intentEvaluator:()=>({answers:{effect_mode:{type:'choice',choice:'adjust'}},usage:{input_tokens:7}}),...options,
  });
}
test('fresh Library opens without a media root; import, CSV, offline files and conflict protection',t=>{
  const {media,library} = fixture(t), store = library.ensureStore();
  assert.deepEqual(store.snapshot().rows,[]);
  assert.deepEqual(store.snapshot().roots,[]);
  store.setRoots([media]);
  const path = join(media,'日本語 video.mp4'); writeFileSync(path,'video');
  const result = store.importPaths([media,path]); assert.equal(result.rows.length,1);
  assert.equal(store.snapshot().rows.length,0,'imports are drafts');
  const columns = [...CORE,'energy'], rows = result.rows.map(r=>({...r,desc:'blue, "smoke"\nゆっくり',bpm:158.52,energy:'low'}));
  const before = store.snapshot(); const saved = store.save(columns,rows,before.revision);
  assert.equal(saved.rows[0].desc,rows[0].desc); assert.equal(saved.rows[0].bpm,158.52);
  assert.throws(()=>store.save(columns,rows,before.revision),e=>e.status===409);
  library.applyCatalog(saved); assert.equal(library.available().length,1);
  assert.equal(library.public(rows[0].id).source_bpm,158.52);
  assert.deepEqual(library.clips[0].attributes,{energy:'low'});
  rmSync(path); assert.equal(library.available().length,0); assert.equal(store.snapshot().rows.length,1);
  const restarted = new Library({cache:library.cache,dataDir:library.dataDir});
  assert.equal(restarted.clips[0].description,rows[0].desc);
  assert.equal(restarted.store.snapshot().revision,saved.revision);
});
test('Library validation, draft IDs, and symlinks outside registered roots',t=>{
  const {dir,media,library} = fixture(t), store = library.ensureStore(); store.setRoots([media]);
  const path = join(media,'a.mov'); writeFileSync(path,'123');
  const outside = join(dir,'outside.mov'); writeFileSync(outside,'123'); symlinkSync(outside,join(media,'escape.mov'));
  assert.deepEqual([...videoFiles(media)],[path]);
  assert.deepEqual(store.resolveDrops([{name:'a.mov',size:3}]).files[0].matches,[path]);
  assert.deepEqual(store.resolveDrops([{name:'a.mov',size:2}]).files[0].matches,[]);
  const {rows} = store.importPaths([path]); const initial = store.snapshot();
  assert.throws(()=>store.save(CORE,[{...rows[0],bpm:-1}],initial.revision));
  assert.throws(()=>store.save([...CORE,'__proto__'],rows,initial.revision));
  assert.throws(()=>store.save(CORE,[rows[0],rows[0]],initial.revision));
  assert.equal(store.snapshot().revision,initial.revision);
  const saved = store.save(CORE,[{...rows[0],desc:'note',bpm:120}],initial.revision);
  assert.equal(store.importPaths([path]).rows[0].id,saved.rows[0].id);
});
test('legacy catalog keeps derived attributes only until its description changes',t=>{
  const {library,media} = fixture(t), [id,legacy] = library.legacyClips.entries().next().value;
  const path = join(media,'a.mp4'); writeFileSync(path,'video');
  const note = library.legacyNotes[id], row = {id,name:'pack/a.mp4',path,bpm:120,desc:note.source_note};
  library.applyCatalog({rows:[row]});
  assert.deepEqual(library.clips[0].attributes,legacy.attributes);
  library.applyCatalog({rows:[{...row,desc:'New description'}]});
  assert.deepEqual(library.clips[0].attributes,{});
  library.applyCatalog({rows:[{...row,desc:''}]}); assert.equal(library.clips.length,0);
});
test('offline explicit initial root does not overwrite/create the catalog',t=>{
  const {dir} = fixture(t), dataDir = join(dir,'offline-library');
  const library = new Library({root:join(dir,'disconnected'),cache:join(dir,'cache'),dataDir});
  assert.throws(()=>library.ensureStore(),e=>e.status===503);
  assert.equal(existsSync(join(dataDir,'footage.csv')),false);
});
test('source BPMs keep decimals and ignore blank values',()=>{
  assert.deepEqual(parseSourceBpms('## Pack\n- a\\_b.mp4: 158.52\n- blank.mp4:',{a:{pack:'pack',filename:'a_b.mp4'}}),{a:158.52});
  assert.throws(()=>parseSourceBpms('## Pack\n- a.mp4: -1',{a:{pack:'Pack',filename:'a.mp4'}}));
});
test('all presets validate; schema migration and Rainbow behavior stay compatible',async()=>{
  for (const d of controls()) for (const p of Object.values(presets(d))) assert.deepEqual(validateChain([p.setting]),[p.setting]);
  assert.equal(validateChain([{id:'trails',params:{halfLife:1,mix:.8},mix:.2}])[0].mix,1);
  assert.equal(validateChain([{id:'colorama',params:{offset:0,repeat:1,palette:3}}])[0].params.palette,4);
  assert.equal(validateChain([{id:'twitch',params:{blurFreq:1}}])[0].params.blurFreq,undefined);
  for (const bad of [NaN,Infinity,true,-1,2]) assert.throws(()=>validateChain([{id:'trails',params:{feedback:bad}}]));
  assert.throws(()=>validateChain([{id:'wat'}]));
  const [chain] = await selectEffects(body=>{
    const data = effectsOff(body); data.answers.colorama.choice='rainbow'; data.answers.colorize.choice='red'; return data;
  },'colorful',{},[],[]);
  assert.equal(chain.length,1); assert.equal(chain[0].id,'colorama');
  assert.equal(chain[0].mix,.4); assert.equal(chain[0].params.speed,.4);
});
test('typed candidates are top-four choices and playback alone commits history',async()=>{
  const p = playerFixture(); const result = await p.select('ゆったり','candidates');
  assert.equal(result.api_calls,6); assert.equal(result.usage.input_tokens,147);
  assert.deepEqual(result.candidates.map(c=>c.clip_id),['pack/f.mp4','pack/e.mp4','pack/d.mp4','pack/c.mp4']);
  assert.equal(p.current,null); assert.deepEqual(p.history,[]);
  const event = p.choose(result.candidates[0].id);
  p.library.job = ()=>({state:'preparing'}); assert.throws(()=>p.played(event.ticket));
  p.library.job = ()=>({state:'ready'}); p.played(event.ticket);
  assert.equal(p.current,'pack/f.mp4'); assert.equal(p.history.length,1);
  assert.throws(()=>p.played(event.ticket),e=>e.status===409);
  p.manualEffects([{id:'trails',params:{feedback:.4}}],p.current,p.effect_revision);
  assert.throws(()=>p.manualEffects([],p.current,0),e=>e.status===409);
  const next = p.choose(result.candidates[1].id); p.played(next.ticket,true);
  assert.deepEqual(p.effects,[]); assert.equal(p.history.length,2);
});
test('new themes clear effect context; adjustments preserve it without mutating playback',async()=>{
  for (const mode of ['new_theme','adjust']) {
    let intentCalls = 0; const bodies = [];
    const p = playerFixture({intentEvaluator:()=>{ intentCalls++; return {answers:{effect_mode:{type:'choice',choice:mode}}}; },effectEvaluator:body=>{ bodies.push(body); return effectsOff(body); }});
    p.current = 'pack/a.mp4'; p.effects = validateChain([{id:'trails'}]); p.effect_history = [{clip_id:p.current,effects:p.effects}];
    const before = structuredClone(p.effects);
    await p.select('more minimal','candidates');
    assert.equal(intentCalls,1); assert.equal(bodies.length,4);
    assert.deepEqual(p.effects,before);
    for (const body of bodies) {
      assert.deepEqual(body.state.current_effects,mode === 'adjust' ? before : []);
      assert.equal(Object.hasOwn(body.questions.trails.criteria,'keep'),mode === 'adjust');
    }
  }
});
test('recent exclusions prevent ABAB and retain the current comparison metadata',async()=>{
  const p = playerFixture(); p.current = 'pack/a.mp4'; p.history = [{clip_id:'pack/b.mp4',played_at:1},{clip_id:p.current,played_at:2}];
  const body = footageRequest('next',p.library.clips,p.history,p.current,p.library.available(),'next');
  assert.deepEqual(body.state.excluded_recent_ids,['pack/a.mp4','pack/b.mp4']);
  assert.equal(body.state.current_clip.id,p.current);
  assert.ok(!body.state.candidate_ids.includes(p.current));
  let input; const rank = p.evaluator; p.evaluator = body=>{ input = body; return rank(body); };
  await p.select('ambient','candidates');
  assert.ok(input.state.candidate_ids.includes(p.current),'current source available for FX-only edits');
  assert.ok(!input.state.candidate_ids.includes('pack/b.mp4'));
  assert.ok(!Object.hasOwn(input.questions.clip.criteria,'no_match'));
});
test('cancel discards in-flight fan-out and expired candidate tickets',async()=>{
  let release, entered;
  const started = new Promise(r=>entered=r), gate = new Promise(r=>release=r);
  const p = playerFixture({effectEvaluator:async body=>{ entered(); await gate; return effectsOff(body); }});
  const pending = p.select('slow','candidates'); await started;
  await assert.rejects(p.select('new','candidates'),e=>e.status===409);
  p.cancel(); release(); await assert.rejects(pending,e=>e.status===409);
  assert.equal(p.busy,false); assert.equal(p.candidates.size,0); assert.equal(p.current,null);
  p.effectEvaluator = effectsOff;
  const old = (await p.select('old','candidates')).candidates[0];
  await p.select('new','candidates'); assert.throws(()=>p.choose(old.id),e=>e.status===409);
});
test('invalid judgments never change playback and release busy state',async()=>{
  for (const overrides of [
    {intentEvaluator:()=>({answers:{}})},
    {evaluator:()=>({answers:{clip:{type:'choice',choice:'no_match',probabilities:{}}}})},
    {effectEvaluator:()=>({answers:{}})},
  ]) {
    const p = playerFixture(overrides); await assert.rejects(p.select('test','candidates'),e=>e.status===502);
    assert.equal(p.current,null); assert.equal(p.busy,false); assert.equal(p.candidates.size,0);
  }
});
test('HTTP transport keeps compact context and retries overload without exposing errors',async()=>{
  const body = {model:'jev-latest',state:{prompt:'日本語',clips:[{id:'a'}]},questions:{}}; let calls = 0;
  const data = await evaluate(body,{key:'test-only',sleep:async()=>{},fetcher:async(url,options)=>{
    assert.equal(url,'https://api.typesafe.ai/v1/systemone');
    assert.equal(options.headers.Authorization,'Bearer test-only');
    const payload = JSON.parse(options.body); assert.equal(typeof payload.state,'string'); assert.deepEqual(JSON.parse(payload.state),body.state);
    return ++calls < 3 ? Response.json({}, {status:429}) : Response.json({answers:{}});
  }});
  assert.equal(calls,3); assert.deepEqual(data,{answers:{}});
  await assert.rejects(evaluate(body,{key:''}),e=>e.status===503);
  await assert.rejects(evaluate(body,{key:'fake',fetcher:async()=>Response.json({detail:{error_type:'max_tokens_exceeded'}},{status:400})}),/input limit/);
});
test('HTTP Library workflow, static allowlist, token/origin validation and byte ranges',async t=>{
  const {media,library} = fixture(t); const p = new Player(library), server = createPlayerServer(p);
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(async()=>{ server.closeAllConnections(); await new Promise(r=>server.close(r)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path,data,headers = {})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-Jev-Token':p.token,...headers},body:JSON.stringify(data)});
  for (const path of ['/', '/library', '/player.js', '/player.css', '/library.css', '/performance-controls.js', '/deck-output.js', '/effect-output.html', '/effect-output.css', '/output-popup.html', '/output-popup.js', '/output-popup.css', '/effects-smoke.html', '/effects-smoke.css']) {
    const asset = await fetch(base+path);
    assert.equal(asset.status,200,path);
    assert.ok((await asset.text()).length > 0,path);
  }
  for (const path of ['/data/clip-notes.md', '/legacy/python/server.py', '/src/client/player.js']) assert.equal((await fetch(base+path)).status,404,path);
  const initial = await (await fetch(base+'/api/library')).json(); assert.deepEqual(initial.rows,[]);
  assert.equal((await fetch(base+'/.env')).status,404);
  assert.equal((await fetch(base+'/src/server/common.mjs')).status,404);
  const badHost = await new Promise((resolve,reject)=>get(base+'/api/status',{headers:{Host:'attacker.test'}},res=>{ res.resume(); resolve(res.statusCode); }).on('error',reject));
  assert.equal(badHost,403);
  assert.equal((await post('/api/clear',{}, {'X-Jev-Token':''})).status,403);
  assert.equal((await post('/api/clear',{}, {Origin:'https://attacker.test'})).status,403);
  assert.equal((await post('/api/library/roots',{roots:[media]})).status,200);
  const path = join(media,'clip.mp4'); writeFileSync(path,'0123456789');
  const imported = await (await post('/api/library/import',{paths:[path]})).json();
  const rows = imported.rows.map(r=>({...r,desc:'minimal',bpm:120}));
  assert.equal((await post('/api/library/save',{columns:CORE,rows,revision:initial.revision})).status,200);
  assert.equal((await post('/api/library/save',{columns:CORE,rows,revision:initial.revision})).status,409);
  assert.equal((await (await fetch(base+'/api/status')).json()).available,1);
  const csv = await (await fetch(base+'/api/library/csv')).text(); assert.ok(csv.includes('minimal'));
  library.jobs.set('test',{state:'ready',path,error:null});
  const range = await fetch(base+'/media/test',{headers:{Range:'bytes=2-5'}});
  assert.equal(range.status,206); assert.equal(await range.text(),'2345');
  const head = await fetch(base+'/media/test',{method:'HEAD',headers:{Range:'bytes=-3'}});
  assert.equal(head.status,206); assert.equal(head.headers.get('content-length'),'3'); assert.equal(await head.text(),'');
  assert.equal((await fetch(base+'/media/test',{headers:{Range:'bytes=99-'}})).status,416);
  assert.equal((await post('/api/candidates',{prompt:'x'.repeat(9000)})).status,413);
});
test('range parser rejects malformed/multiple ranges',()=>{
  assert.deepEqual(byteRange(undefined,10),[0,9,200]); assert.deepEqual(byteRange('bytes=-3',10),[7,9,206]);
  for (const range of ['bytes=-0','bytes=8-2','bytes=10-','bytes=0-1,4-5','bytes=-','garbage']) assert.throws(()=>byteRange(range,10),e=>e.status===416);
});
test('npm-installed video tools convert MOV and preserve ready cache across restart',async t=>{
  const {media,library} = fixture(t), path = join(media,'synthetic.mov');
  await run(videoTools.ffmpeg,['-nostdin','-v','error','-f','lavfi','-i','color=c=red:s=32x32:r=10','-t','0.2','-c:v','mpeg4',path]);
  const asset = library.preparePath(path);
  for (let i=0;i<200 && library.job(asset).state==='preparing';i++) await delay(50);
  const job = library.job(asset); assert.equal(job.state,'ready',job.error); assert.notEqual(job.path,path);
  const {stdout} = await run(videoTools.ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,pix_fmt','-of','json',job.path]);
  assert.equal(JSON.parse(stdout).streams[0].codec_name,'h264');
  const restarted = new Library({cache:library.cache,dataDir:library.dataDir});
  assert.equal(restarted.preparePath(path),asset); assert.equal(restarted.job(asset).state,'ready');
  assert.equal(library.preparePath(job.path) !== null,true);
  // Wait for the MP4 passthrough probe before deleting the test directory.
  const passthrough = library.preparePath(job.path);
  for (let i=0;i<200 && library.job(passthrough).state==='preparing';i++) await delay(50);
  assert.equal(library.job(passthrough).path,job.path);
});
