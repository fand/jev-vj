import type { Effect, EffectContext, EffectRenderTarget } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_ACCUMULATE = `#version 300 es
precision highp float;
in vec2 uvContent;
in vec2 uvSrc;
out vec4 outColor;

uniform sampler2D src;
uniform sampler2D history;
uniform float u_feedback;
uniform bool seed;

void main() {
  vec4 current = texture(src, uvSrc);
  if (seed) {
    outColor = current;
    return;
  }

  // Both textures are premultiplied. Interpolating all four channels keeps
  // transparent edges free of unassociated RGB when this is finally blended.
  float t = clamp(u_feedback, 0.0, 1.0);
  outColor = mix(current, texture(history, uvContent), t * 0.5);
}
`;

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
    // Preserve fractional history values between frames.
    this.#history = ctx.createRenderTarget({ persistent: true, float: true, filter: 'linear' });
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

    ctx.draw({
      frag: FRAG_ACCUMULATE,
      uniforms: { src: ctx.src, history, u_feedback: this.#params.feedback, seed: this.#resetPending },
      target: history,
    });
    ctx.blit(history, ctx.target);

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
  description: 'Per-frame feedback trails, blending 0–50% of the previous frame.',
  order: 60,
  controls: [
    { key: 'feedback', label: 'Feedback', min: 0, max: 1, step: 0.001, value: 0.4 },
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
