import type { Effect, EffectContext } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_INVERT = `#version 300 es
precision highp float;
in vec2 uvContent;
out vec4 outColor;

uniform sampler2D src;
uniform vec4 srcRectUv;
uniform int red;
uniform int green;
uniform int blue;

void main() {
  vec4 color = texture(src, srcRectUv.xy + uvContent * srcRectUv.zw);
  vec3 rgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);

  if (red == 1) rgb.r = 1.0 - rgb.r;
  if (green == 1) rgb.g = 1.0 - rgb.g;
  if (blue == 1) rgb.b = 1.0 - rgb.b;

  // Source and final canvas blending use premultiplied alpha. Inverting the
  // associated RGB first would produce alpha-dependent colours at edges.
  outColor = vec4(rgb * color.a, color.a);
}
`;

class InvertEffect implements Effect {
  #params: EffectParams;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, initial);
  }

  setParams(params: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...params });
  }

  render(ctx: EffectContext): void {
    ctx.draw({
      frag: FRAG_INVERT,
      uniforms: {
        src: ctx.src,
        red: Math.round(this.#params.red),
        green: Math.round(this.#params.green),
        blue: Math.round(this.#params.blue),
      },
      target: ctx.target,
    });
  }
}

export const definition: EffectDefinition = {
  id: 'invert',
  name: 'Invert',
  description: 'Invert selected RGB channels while preserving alpha.',
  order: 50,
  controls: [
    { key: 'red', label: 'Red', min: 0, max: 1, step: 1, value: 1 },
    { key: 'green', label: 'Green', min: 0, max: 1, step: 1, value: 1 },
    { key: 'blue', label: 'Blue', min: 0, max: 1, step: 1, value: 1 },
  ],
  create(params: EffectParams) {
    const effect = new InvertEffect(params);
    return { effect, setParams: updates => effect.setParams(updates) };
  },
};
