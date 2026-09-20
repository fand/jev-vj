import type { Effect, EffectContext, EffectRenderTarget } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_ACCUMULATE = `#version 300 es
precision highp float;
in vec2 uvContent;
in vec2 uvSrc;
out vec4 outColor;

uniform sampler2D src;
uniform sampler2D history;
uniform float retention;
uniform bool seed;

void main() {
  vec4 current = texture(src, uvSrc);
  if (seed) {
    outColor = current;
    return;
  }

  // Both textures are premultiplied. Interpolating all four channels keeps
  // transparent edges free of unassociated RGB when this is finally blended.
  outColor = mix(current, texture(history, uvContent), retention);
}
`;

const FRAG_OUTPUT = `#version 300 es
precision highp float;
in vec2 uvContent;
in vec2 uvSrc;
out vec4 outColor;

uniform sampler2D src;
uniform sampler2D history;
uniform float mixAmount;

void main() {
  outColor = mix(texture(src, uvSrc), texture(history, uvContent), mixAmount);
}
`;

const MAX_DELTA_SECONDS = 0.25;

class TrailsEffect implements Effect {
  #params: EffectParams;
  #history: EffectRenderTarget | undefined;
  #resetPending = true;
  #historySize: readonly [number, number] | undefined;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, initial);
  }

  setParams(params: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...params });
  }

  reset(): void {
    this.#resetPending = true;
  }

  init(ctx: EffectContext): void {
    this.#history = ctx.createRenderTarget({ persistent: true, filter: 'linear' });
    ctx.onContextRestored(() => this.reset());
  }

  render(ctx: EffectContext): void {
    const history = this.#history;
    if (!history) {
      ctx.blit(ctx.src, ctx.target);
      return;
    }

    const size: readonly [number, number] = [history.width, history.height];
    if (
      !this.#historySize ||
      this.#historySize[0] !== size[0] ||
      this.#historySize[1] !== size[1]
    ) {
      this.#historySize = size;
      this.#resetPending = true;
    }

    const halfLife = this.#params.halfLife;
    // Clamp a resumed tab's delta so a long suspension does not erase trails
    // in a single frame. For ordinary frames the exponential is exact.
    const dt = Math.min(Math.max(ctx.deltaTime, 0), MAX_DELTA_SECONDS);
    const retention = 2 ** (-dt / halfLife);
    const seed = this.#resetPending;

    ctx.draw({
      frag: FRAG_ACCUMULATE,
      uniforms: { src: ctx.src, history, retention, seed },
      target: history,
    });
    ctx.draw({
      frag: FRAG_OUTPUT,
      uniforms: { src: ctx.src, history, mixAmount: this.#params.mix },
      target: ctx.target,
    });

    this.#resetPending = false;
  }

  dispose(): void {
    this.#history?.dispose();
    this.#history = undefined;
    this.#historySize = undefined;
  }
}

export const definition: EffectDefinition = {
  id: 'trails',
  name: 'Trails',
  description: 'Persistent, fading frame accumulation for motion trails.',
  order: 60,
  controls: [
    { key: 'halfLife', label: 'Half-life', min: 0.05, max: 10, step: 0.05, value: 0.8 },
    { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, value: 0.7 },
  ],
  create(params: EffectParams) {
    const effect = new TrailsEffect(params);
    return {
      effect,
      setParams: updates => effect.setParams(updates),
      reset: () => effect.reset(),
    };
  },
};
