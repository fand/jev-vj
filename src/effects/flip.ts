import type { Effect, EffectContext } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_FLIP = `#version 300 es
precision highp float;
in vec2 uvContent;
out vec4 outColor;

uniform sampler2D src;
uniform vec4 srcRectUv;
uniform int horizontal;
uniform int vertical;

void main() {
  vec2 uv = uvContent;
  if (horizontal == 1) uv.x = 1.0 - uv.x;
  if (vertical == 1) uv.y = 1.0 - uv.y;

  // Map element-local coordinates through the current source stage. This
  // reverses the whole image; it deliberately does not fold either half.
  outColor = texture(src, srcRectUv.xy + uv * srcRectUv.zw);
}
`;

class FlipEffect implements Effect {
  #params: EffectParams;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, initial);
  }

  setParams(params: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...params });
  }

  render(ctx: EffectContext): void {
    ctx.draw({
      frag: FRAG_FLIP,
      uniforms: {
        src: ctx.src,
        horizontal: Math.round(this.#params.horizontal),
        vertical: Math.round(this.#params.vertical),
      },
      target: ctx.target,
    });
  }
}

export const definition: EffectDefinition = {
  id: 'flip',
  name: 'Flip',
  description: 'Reverse the full image horizontally and/or vertically.',
  order: 10,
  controls: [
    { key: 'horizontal', label: 'Horizontal', min: 0, max: 1, step: 1, value: 1 },
    { key: 'vertical', label: 'Vertical', min: 0, max: 1, step: 1, value: 0 },
  ],
  create(params: EffectParams) {
    const effect = new FlipEffect(params);
    return { effect, setParams: updates => effect.setParams(updates) };
  },
};
