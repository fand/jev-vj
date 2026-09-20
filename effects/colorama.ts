import type { Effect, EffectContext } from '@vfx-js/core';
import { GradientMapEffect } from '@vfx-js/effects';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types';

const MAX_DELTA_SECONDS = 0.25;

const palettes = [
  ['#f72585', '#7209b7', '#4361ee', '#4cc9f0', '#f9c74f'],
  ['#12000a', '#7d110c', '#e74c16', '#ffb000', '#fff3bf'],
  ['#06152d', '#0b4f8a', '#25a9d8', '#a8ebff', '#f5fdff'],
  ['#080808', '#f5f5f5'],
  ['#090012', '#5b00a8', '#ff2db2', '#74ffdf', '#fff36b'],
] as const;

const repeatModes = ['none', 'repeat', 'mirror'] as const;

class ContinuousGradientMapEffect implements Effect {
  #params: EffectParams;
  #phase = 0;
  #effect: GradientMapEffect;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, { ...defaults(definition), ...initial });
    this.#effect = new GradientMapEffect();
    this.#apply();
  }

  setParams(updates: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...updates });
    this.#apply();
  }

  reset(): void {
    this.#phase = 0;
  }

  render(ctx: EffectContext): void {
    const dt = Math.min(Math.max(ctx.deltaTime, 0), MAX_DELTA_SECONDS);
    this.#phase += dt * this.#params.speed;
    this.#effect.render({ ...ctx, time: this.#phase });
  }

  #apply(): void {
    this.#effect.setParams({
      colors: [...palettes[Math.round(this.#params.palette)]],
      frequency: this.#params.frequency,
      offset: this.#params.offset,
      repeat: repeatModes[Math.round(this.#params.repeat)],
      mixSpace: 'oklab',
      speed: 1,
    });
  }
}

export const definition: EffectDefinition = {
  id: 'colorama',
  name: 'Colorama',
  description: 'Maps luminance through a cycling color palette while preserving transparency.',
  order: 50,
  controls: [
    { key: 'palette', label: 'Palette: 0 rainbow, 1 fire, 2 ice, 3 monochrome, 4 neon', min: 0, max: 4, step: 1, value: 0 },
    { key: 'frequency', label: 'Color bands', min: 0.25, max: 4, step: 0.05, value: 1 },
    { key: 'offset', label: 'Phase', min: 0, max: 1, step: 0.01, value: 0 },
    { key: 'repeat', label: 'Repeat: 0 clamp, 1 repeat, 2 mirror', min: 0, max: 2, step: 1, value: 2 },
    { key: 'speed', label: 'Cycle speed', min: 0, max: 1, step: 0.01, value: 0.08 },
  ],
  create(params: EffectParams) {
    const effect = new ContinuousGradientMapEffect(params);
    return { effect, setParams: updates => effect.setParams(updates), reset: () => effect.reset() };
  },
};
