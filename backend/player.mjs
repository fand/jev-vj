import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {ROOT, Problem, readJSON, readKey, token, finite, record} from './common.mjs';
import {Library, videoTools} from './library.mjs';
import {isFile} from './footage-store.mjs';
import {classifyEffectIntent, selectEffects, validateChain} from './effects.mjs';
const prompts = readJSON(join(ROOT,'backend/prompts.json'));
export const recentClipIds = (history,current) => [...new Set([...(current ? [current] : []), ...history.toReversed().map(h=>h.clip_id)])].slice(0,3);
export function footageRequest(prompt, clips, history, current, available, action, packNotes = {}, excluded = recentClipIds(history,current)) {
  const candidates = available.filter(id=>!excluded.includes(id) && (action !== 'next' || id !== current));
  const criteria = Object.fromEntries(clips.filter(c=>candidates.includes(c.id)).map(c=>[c.id,c.description ?? c.id]));
  if (action !== 'candidates') criteria.no_match = 'Not a visual direction, all candidates violate explicit constraints, or no candidate supports the requested relative change. Never just because a mood/theme lacks an exact literal match.';
  return {model:'jev-latest',state:{prompt,action,clips,available_ids:available,candidate_ids:candidates,excluded_recent_ids:excluded,pack_notes:packNotes,current_clip_id:current,current_clip:clips.find(c=>c.id === current) ?? null,history:history.slice(-12).map(h=>Object.fromEntries(['clip_id','played_at'].filter(k=>Object.hasOwn(h,k)).map(k=>[k,h[k]]))),metadata_policy:'Known attributes only. Color temperature is derived from palette; beat_pattern is visual, not live sync.'},questions:{clip:{type:'choice',instructions:action === 'candidates' ? prompts.candidates : prompts.footage,criteria}}};
}
export async function evaluate(body, {fetcher = fetch, key = readKey(), sleep = delay} = {}) {
  if (!key) throw new Problem('TypeSafe API key is not configured.',503);
  const payload = JSON.stringify({...body,state:JSON.stringify(body.state)});
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetcher('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:payload,signal:AbortSignal.timeout(45000)});
    } catch { throw new Problem('The connection to Jev timed out.',502); }
    if (response.ok) return response.json();
    const detail = await response.json().catch(()=>null);
    if (response.status === 400 && detail?.detail?.error_type === 'max_tokens_exceeded') throw new Problem('Footage metadata exceeds Jev’s input limit. Adjust the catalog payload.',502);
    if ([429,529].includes(response.status) && attempt < 2) { await sleep(1000*2**attempt); continue; }
    throw new Problem(`Jev API: HTTP ${response.status}. Please try again.`,502);
  }
}
export class Player {
  constructor(library = new Library(), {evaluator = evaluate, effectEvaluator = evaluate, intentEvaluator = evaluate} = {}) {
    Object.assign(this,{library,evaluator,effectEvaluator,intentEvaluator,effects:[],effect_history:[],effect_revision:0,token:token(32),history:[],current:null,pending:null,prompt:'',last_selection:null,candidates:new Map(),busy:false,generation:0});
  }
  status() {
    return {token:this.token,ready:!!readKey(),busy:this.busy,total:this.library.clips.length,available:this.library.available().length,axis_count:Object.keys(this.library.axes).length,history:this.history,current:this.current ? this.library.public(this.current) : null,current_asset:this.current ? this.history.at(-1)?.asset ?? null : null,prompt:this.prompt,last_selection:this.last_selection,effects:this.effects,effect_revision:this.effect_revision,labels:Object.fromEntries(Object.entries(this.library.axes).map(([k,v])=>[k,v.label_en || k.replaceAll('.',' / ').replaceAll('_',' ')])),ffmpeg:isFile(videoTools.ffmpeg) && isFile(videoTools.ffprobe)};
  }
  cancel(clear = false) {
    this.generation++; this.pending = null; this.candidates.clear();
    if (clear) { this.history = []; this.current = null; this.prompt = ''; this.last_selection = null; this.effects = []; this.effect_history = []; this.effect_revision++; }
    return {ok:true};
  }
  async select(prompt, action = 'select') {
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.trim().length > 1000 || !['select','next','effects','candidates'].includes(action)) throw new Problem('Enter a prompt between 1 and 1,000 characters.');
    if (this.busy) throw new Problem('Jev is selecting candidates. Please wait.',409);
    const available = this.library.available();
    if (!available.length) throw new Problem('No described videos found. Add footage and descriptions in Library, then save.',503);
    if (action === 'effects' && !this.current) throw new Problem('Select a clip first.');
    this.busy = true; const version = ++this.generation;
    this.pending = null; this.candidates.clear();
    const history = this.history.slice(-12).map(({clip_id,prompt,played_at})=>({clip_id,prompt,played_at})), current = this.current;
    const currentEffects = structuredClone(this.effects), effectHistory = structuredClone(this.effect_history), start = performance.now();
    const check = () => { if (version !== this.generation) throw new Problem('Selection canceled.',409); };
    prompt = prompt.trim();
    try {
      const recent = recentClipIds(history,current), blocked = recent.filter(id=>available.includes(id) && (action !== 'next' || id !== current));
      if (action === 'candidates') while (blocked.length && available.filter(id=>!blocked.includes(id)).length < 4) blocked.pop();
      let mode, intentData;
      try { [mode,intentData] = await classifyEffectIntent(this.intentEvaluator,prompt,this.library.clips.find(c=>c.id === current) ?? null,currentEffects); }
      catch (e) { if (e instanceof TypeError) throw new Problem('Jev returned an invalid effect intent. Playback is unchanged.',502); throw e; }
      const effectContext = mode === 'adjust' ? currentEffects : [], effectRecent = mode === 'adjust' ? effectHistory : [];
      const usage = {}; let calls = 1;
      const addUsage = data => { for (const k of ['input_tokens','output_tokens']) if (finite(data.usage?.[k])) usage[k] = (usage[k] ?? 0)+data.usage[k]; };
      addUsage(intentData);
      let body, data, answer, chosen;
      while (true) {
        check();
        if (action === 'effects') { chosen = current; answer = {probabilities:{[current]:1}}; data = {}; break; }
        body = footageRequest(prompt,this.library.clips,history,current,available,action,this.library.pack_notes,[...blocked]);
        body.state.current_effects = effectContext;
        body.questions.clip.instructions += '\nAfter selection, effects can recolor, mirror, pixelate, outline or add trails/glitches. Choose source content and intrinsic movement first. Do not reject only for a correctable palette mismatch. Relative motion requests still need source evidence; effects cannot remove intrinsic rapid flashing.';
        if (current && available.includes(current) && ['select','candidates'].includes(action)) {
          if (!body.state.candidate_ids.includes(current)) body.state.candidate_ids.push(current);
          body.questions.clip.criteria[current] = 'Keep current source if the prompt is best satisfied by changing only its effects.';
          body.state.excluded_recent_ids = body.state.excluded_recent_ids.filter(id=>id !== current);
        }
        if (!body.state.candidate_ids.length) {
          if (action === 'candidates') throw new Problem('No playable candidates. Rescan the media library.',503);
          data = {answers:{clip:{type:'choice',choice:'no_match',probabilities:{}}}};
        } else { data = await this.evaluator(body); calls++; addUsage(data); }
        answer = data.answers?.clip ?? {}; chosen = answer.choice;
        if (answer.type !== 'choice' || !Object.hasOwn(body.questions.clip.criteria,chosen)) throw new Problem('Jev returned an invalid footage selection. Playback is unchanged.',502);
        if (chosen !== 'no_match' || !blocked.length) break;
        blocked.pop();
      }
      if (!record(answer.probabilities)) throw new Problem('Jev returned invalid candidate probabilities.',502);
      const allowed = action === 'candidates' ? body.state.candidate_ids : available;
      const ranked = Object.entries(answer.probabilities).filter(([id,p])=>allowed.includes(id) && finite(p) && p >= 0 && p <= 1).sort((a,b)=>b[1]-a[1]).slice(0,action === 'candidates' ? 4 : 3);
      const effectsFor = async id => {
        try { return await selectEffects(this.effectEvaluator,prompt,this.library.clips.find(c=>c.id === id),effectContext,effectRecent,mode); }
        catch (e) { if (e instanceof TypeError) throw new Problem('Jev returned invalid effects. Playback is unchanged.',502); throw e; }
      };
      check();
      if (action === 'candidates') {
        if (!ranked.length) throw new Problem('Jev did not return candidate probabilities.',502);
        // Wait for every request even on failure: keep the busy guard until fan-out ends.
        const results = await Promise.allSettled(ranked.map(async ([id,weight])=>({id,weight,result:await effectsFor(id)})));
        check();
        const failed = results.find(r=>r.status === 'rejected'); if (failed) throw failed.reason;
        const entries = results.map(({value:{id,weight,result:[effects,response]}})=>{
          addUsage(response);
          return {id:token(),clip_id:id,clip:this.library.public(id),effects,weight,asset:this.library.prepare(id),prompt,comparison_clip_id:current};
        });
        this.candidates = new Map(entries.map(e=>[e.id,e]));
        return {candidates:entries,effect_mode:mode,ms:Math.round(performance.now()-start),usage,api_calls:calls+entries.length,model:data.model};
      }
      let effects = currentEffects, effectData = {}, asset = null;
      if (chosen !== 'no_match') {
        if (chosen !== current) asset = this.library.prepare(chosen);
        [effects,effectData] = await effectsFor(chosen); calls++; addUsage(effectData);
      }
      check();
      const event = {clip_id:chosen,prompt,effect_mode:mode,ms:Math.round(performance.now()-start),comparison_clip_id:current,effects,effect_usage:effectData.usage,usage,model:data.model || effectData.model,api_calls:calls,repeat_fallback:recent.includes(chosen),alternatives:ranked.map(([id,weight])=>({name:this.library.public(id).name,weight}))};
      this.prompt = prompt;
      const outcome = chosen === 'no_match' ? 'no_match' : chosen === current ? JSON.stringify(effects) !== JSON.stringify(currentEffects) ? 'effects_updated' : 'keep' : 'selected';
      this.last_selection = {...event,outcome};
      if (!['selected','effects_updated'].includes(outcome)) return {...this.last_selection};
      this.pending = {...event,outcome,ticket:token(),asset:asset || this.history.at(-1).asset,clip:this.library.public(chosen)};
      return {...this.pending};
    } finally { this.busy = false; }
  }
  choose(id) {
    if (typeof id !== 'string' || !this.candidates.has(id)) throw new Problem('Candidates have changed. Select a current candidate.',409);
    if (this.busy) throw new Problem('Candidates are updating. Please wait.',409);
    this.generation++;
    this.pending = {...this.candidates.get(id),outcome:'selected',ticket:token()};
    return {...this.pending};
  }
  played(ticket, effectsFailed = false) {
    if (!this.pending || this.pending.ticket !== ticket) throw new Problem('This playback confirmation has expired.',409);
    if (this.library.job(this.pending.asset).state !== 'ready') throw new Problem('The video is still being prepared.',409);
    const event = {...this.pending,played_at:Date.now()/1000};
    if (effectsFailed) { event.effects = []; event.effects_failed = true; }
    this.current = event.clip_id; this.prompt = event.prompt; this.effects = event.effects ?? []; this.effect_revision++;
    this.effect_history = [...this.effect_history,{clip_id:this.current,effects:this.effects}].slice(-12);
    if (event.outcome === 'selected') this.history = [...this.history,event].slice(-30);
    this.pending = null; return {ok:true};
  }
  manualEffects(chain, id, revision) {
    try { chain = validateChain(chain); } catch { throw new Problem('Invalid effect settings.'); }
    if (this.busy || this.pending || !this.current || id !== this.current || !Number.isInteger(revision) || revision !== this.effect_revision) throw new Problem('The clip has changed. Please adjust the effects again.',409);
    this.effects = chain; this.effect_revision++;
    this.effect_history = [...this.effect_history,{clip_id:this.current,effects:chain}].slice(-12);
    return {ok:true};
  }
}
