import type { Effect, EffectContext } from '@vfx-js/core';
import { HueShiftEffect } from '@vfx-js/effects';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types';

const MAX_DELTA_SECONDS = 0.25;

class CyclingHueShiftEffect implements Effect {
  #params: EffectParams;
  #phase = 0;
  #effect: HueShiftEffect;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, { ...defaults(definition), ...initial });
    this.#effect = new HueShiftEffect({ shift: this.#params.shift });
  }

  setParams(updates: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...updates });
  }

  reset(): void {
    this.#phase = 0;
    this.#applyShift();
  }

  render(ctx: EffectContext): void {
    const dt = Math.min(Math.max(ctx.deltaTime, 0), MAX_DELTA_SECONDS);
    this.#phase = (this.#phase + dt * this.#params.speed) % 1;
    this.#applyShift();
    this.#effect.render(ctx);
  }

  #applyShift(): void {
    this.#effect.setParams({ shift: (this.#params.shift + this.#phase) % 1 });
  }
}

export const definition: EffectDefinition = {
  id: 'hue',
  name: 'Hue',
  description: 'Rotates hue with an optional continuous color cycle.',
  order: 40,
  controls: [
    { key: 'shift', label: 'Hue shift', min: 0, max: 1, step: 0.01, value: 0 },
    { key: 'speed', label: 'Cycle speed', min: 0, max: 1, step: 0.01, value: 0 },
  ],
  create(params: EffectParams) {
    const effect = new CyclingHueShiftEffect(params);
    return { effect, setParams: updates => effect.setParams(updates), reset: () => effect.reset() };
  },
};
