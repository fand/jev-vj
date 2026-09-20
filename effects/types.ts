import type { Effect } from '@vfx-js/core';
export type EffectParams = Record<string, number>;
export type Control = { key: string; label: string; min: number; max: number; step: number; value: number };
export type EffectInstance = { effect: Effect; setParams(params: EffectParams): void; reset?(): void };
export type EffectDefinition = {
  id: string; name: string; description: string; order: number;
  controls: Control[];
  create(params: EffectParams): EffectInstance;
};
export function defaults(def: EffectDefinition): EffectParams {
  return Object.fromEntries(def.controls.map(c => [c.key, c.value]));
}
export function sanitize(def: EffectDefinition, input: EffectParams): EffectParams {
  return Object.fromEntries(def.controls.map(c => {
    const v = input[c.key];
    return [c.key, typeof v === 'number' && Number.isFinite(v) ? Math.min(c.max, Math.max(c.min, v)) : c.value];
  }));
}
