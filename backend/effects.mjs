import {join} from 'node:path';
import {ROOT, readJSON, record, finite} from './common.mjs';
const prompts = readJSON(join(ROOT, 'backend/prompts.json'));
const variants = readJSON(join(ROOT, 'backend/presets.json'));
export const controls = () => readJSON(join(ROOT, 'effects/controls.json'));
const invalid = () => { throw new TypeError('Invalid effect settings'); };
function legacyRange(params, key, min = -Infinity, max = Infinity) {
  if (Object.hasOwn(params, key) && (!finite(params[key]) || params[key] < min || params[key] > max)) invalid();
}
export function migrateParams(id, params) {
  if (!record(params)) return params;
  params = {...params};
  if (id === 'twitch') {
    legacyRange(params, 'blurFreq', 0, 1); delete params.blurFreq;
    const old = ['amplitude','frequency','duration','axis','zoom','motionBlur'];
    if (old.some(k=>Object.hasOwn(params,k))) {
      old.forEach(k=>legacyRange(params,k));
      const {amplitude = .18, frequency = 6, axis = 1, zoom = 0, motionBlur = .8} = params;
      const rate = frequency > 0 ? Math.min(1, Math.sqrt(Math.max(0,(frequency-.5)/30))) : 0;
      params = {posX:axis !== 2 ? amplitude : 0, posY:axis !== 1 ? amplitude : 0, posFreq:rate, scaleAmount:zoom/2, scaleFreq:rate, rgbAmount:0, lightAmount:0, blurAmount:motionBlur, ...Object.fromEntries(Object.entries(params).filter(([k])=>!old.includes(k)))};
    }
  } else if (id === 'shift-glitch' && ['amount','bandSize'].some(k=>Object.hasOwn(params,k))) {
    ['amount','bandSize'].forEach(k=>legacyRange(params,k));
    const {amount = 24, bandSize = 48, vertical = 0, ...rest} = params, coverage = amount === 0 ? 0 : .25;
    params = {...rest, size:bandSize, vertical:vertical ? coverage : 0, horizontal:vertical ? 0 : coverage};
  } else if (id === 'trails' && ['halfLife','mix'].some(k=>Object.hasOwn(params,k))) {
    legacyRange(params,'halfLife',.05,10); legacyRange(params,'mix',0,1);
    delete params.halfLife; delete params.mix; params = {feedback:.4,...params};
  } else if (id === 'colorama' && ['offset','repeat'].some(k=>Object.hasOwn(params,k))) {
    legacyRange(params,'frequency',.25,4); legacyRange(params,'offset',0,1); legacyRange(params,'repeat',0,2); legacyRange(params,'palette',0,4);
    const palette = params.palette ?? 0;
    delete params.offset; delete params.repeat;
    params.palette = [0,2,3,4,0][Math.round(palette)];
  }
  return params;
}
export function validateChain(chain) {
  const definitions = controls(), catalog = new Map(definitions.map(d=>[d.id,d]));
  if (!Array.isArray(chain) || chain.length > catalog.size) invalid();
  const seen = new Set();
  return chain.map(item => {
    if (!record(item) || !catalog.has(item.id) || seen.has(item.id)) invalid();
    seen.add(item.id);
    const definition = catalog.get(item.id), params = migrateParams(item.id, item.params ?? {}), mix = item.mix ?? 1;
    if (!record(params) || Object.keys(params).some(k=>!definition.controls.some(c=>c.key===k)) || !finite(mix) || mix < 0 || mix > 1) invalid();
    const normalized = Object.fromEntries(definition.controls.map(c => {
      const value = Object.hasOwn(params,c.key) ? params[c.key] : c.value;
      if (!finite(value) || value < c.min || value > c.max) invalid();
      return [c.key,value];
    }));
    return {id:item.id, params:normalized, mix:item.id === 'trails' ? 1 : mix};
  }).sort((a,b)=>catalog.get(a.id).order-catalog.get(b.id).order || a.id.localeCompare(b.id));
}
export function presets(definition) {
  const base = Object.fromEntries(definition.controls.map(c=>[c.key,c.value]));
  return Object.fromEntries(Object.entries(variants[definition.id]).map(([key,p])=>[key, {description:p.description, setting:{id:definition.id, params:{...base,...p.params}, mix:p.mix}}]));
}
export async function classifyEffectIntent(evaluate, prompt, current_clip, current_effects) {
  const data = await evaluate({model:'jev-latest',state:{prompt,current_clip,current_effects},questions:{effect_mode:prompts.intent}});
  const answer = data.answers?.effect_mode;
  if (answer?.type !== 'choice' || !['new_theme','adjust'].includes(answer.choice)) invalid();
  return [answer.choice,data];
}
export function effectRequest(prompt, clip, current_effects, recent, mode = 'adjust') {
  const current = new Map(current_effects.map(e=>[e.id,e]));
  const questions = Object.fromEntries(controls().map(d=>[d.id, {type:'choice', instructions:prompts.effects[d.id], criteria:{off:'Do not apply this effect.', ...Object.fromEntries(Object.entries(presets(d)).map(([k,p])=>[k,p.description])), ...(current.has(d.id) ? {keep:'Keep exactly the current setting of this effect.'} : {})}}]));
  return {model:'jev-latest',state:{prompt,effect_mode:mode,selected_clip:clip,current_effects,recent_presentations:recent.slice(-6)},questions};
}
export async function selectEffects(evaluate, prompt, clip, currentEffects, recent, mode = 'adjust') {
  if (mode === 'new_theme') { currentEffects = []; recent = []; }
  const body = effectRequest(prompt,clip,currentEffects,recent,mode), data = await evaluate(body);
  const current = new Map(currentEffects.map(e=>[e.id,e])), selected = [];
  for (const d of controls()) {
    const answer = data.answers?.[d.id];
    if (answer?.type !== 'choice' || !Object.hasOwn(body.questions[d.id].criteria, answer.choice)) invalid();
    if (answer.choice !== 'off') selected.push(structuredClone(answer.choice === 'keep' ? current.get(d.id) : presets(d)[answer.choice].setting));
  }
  let chain = validateChain(selected);
  if (chain.some(e=>e.id === 'colorama' && e.params.palette < 4)) chain = chain.filter(e=>e.id !== 'colorize');
  return [chain,data];
}
