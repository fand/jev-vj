import type { Effect, EffectContext } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_MIRROR = `#version 300 es
precision highp float;
in vec2 uvContent;
out vec4 outColor;

uniform sampler2D src;
uniform vec4 srcRectUv;
uniform int mode;
uniform float centerX;
uniform float centerY;

void main() {
  vec2 uv = uvContent;

  // Retain the right / upper side and fold the other side over it. This is a
  // reflection around the chosen axis, unlike Flip which reverses all pixels.
  if (mode == 0 || mode == 2) uv.x = centerX + abs(uv.x - centerX);
  if (mode == 1 || mode == 2) uv.y = centerY + abs(uv.y - centerY);

  // uvContent is element-local; srcRectUv preserves the current chain's
  // capture/intermediate mapping. Source is already premultiplied.
  outColor = texture(src, srcRectUv.xy + uv * srcRectUv.zw);
}
`;

class MirrorEffect implements Effect {
  #params: EffectParams;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, initial);
  }

  setParams(params: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...params });
  }

  render(ctx: EffectContext): void {
    ctx.draw({
      frag: FRAG_MIRROR,
      uniforms: {
        src: ctx.src,
        mode: Math.round(this.#params.mode),
        centerX: this.#params.centerX,
        centerY: this.#params.centerY,
      },
      target: ctx.target,
    });
  }
}

export const definition: EffectDefinition = {
  id: 'mirror',
  name: 'Mirror',
  description: 'Reflect one half of the image across a movable horizontal or vertical axis.',
  order: 10,
  controls: [
    { key: 'mode', label: 'Mode', min: 0, max: 2, step: 1, value: 0 },
    { key: 'centerX', label: 'Center X', min: 0, max: 1, step: 0.01, value: 0.5 },
    { key: 'centerY', label: 'Center Y', min: 0, max: 1, step: 0.01, value: 0.5 },
  ],
  create(params: EffectParams) {
    const effect = new MirrorEffect(params);
    return { effect, setParams: updates => effect.setParams(updates) };
  },
};
