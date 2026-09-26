import type { Effect, EffectContext } from '@vfx-js/core';
import { RgbShiftEffect } from '@vfx-js/effects';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types';

const MAX_DELTA_SECONDS = 0.25;

class ContinuousRgbShiftEffect implements Effect {
  #params: EffectParams;
  #phase = 0;
  #effect: RgbShiftEffect;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, { ...defaults(definition), ...initial });
    this.#effect = new RgbShiftEffect({ amount: this.#params.amount, speed: 1 });
  }

  setParams(updates: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...updates });
    this.#effect.setParams({ amount: this.#params.amount, speed: 1 });
  }

  reset(): void {
    this.#phase = 0;
  }

  render(ctx: EffectContext): void {
    const dt = Math.min(Math.max(ctx.deltaTime, 0), MAX_DELTA_SECONDS);
    this.#phase += dt * this.#params.speed;
    this.#effect.render({ ...ctx, time: this.#phase });
  }
}

export const definition: EffectDefinition = {
  id: 'rgb',
  name: 'RGB Shift',
  description: 'Animated horizontal separation of red, green, and blue channels.',
  order: 30,
  controls: [
    { key: 'amount', label: 'Amount', min: 0, max: 40, step: 1, value: 6 },
    { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.05, value: 0.6 },
  ],
  create(params: EffectParams) {
    const effect = new ContinuousRgbShiftEffect(params);
    return { effect, setParams: updates => effect.setParams(updates), reset: () => effect.reset() };
  },
};
