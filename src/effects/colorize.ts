import type { Effect, EffectContext } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_COLORIZE = `#version 300 es
precision highp float;
in vec2 uvContent;
out vec4 outColor;

uniform sampler2D src;
uniform vec4 srcRectUv;
uniform float hue;
uniform float saturation;
uniform float brightness;

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
  vec4 color = texture(src, srcRectUv.xy + uvContent * srcRectUv.zw);
  vec3 sourceRgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);
  const vec3 lumaWeights = vec3(0.299, 0.587, 0.114);
  float luma = dot(sourceRgb, lumaWeights);

  vec3 tint = hsv2rgb(vec3(hue / 360.0, saturation, 1.0));
  // Unit-luminance tint keeps the source's luminance intact. At saturation
  // zero tint is white, so the result is a true monochrome image. Saturated
  // hues can leave sRGB gamut, so clip before restoring premultiplied alpha.
  tint /= max(dot(tint, lumaWeights), 0.00001);
  vec3 rgb = clamp(tint * luma * brightness, 0.0, 1.0);

  outColor = vec4(rgb * color.a, color.a);
}
`;

class ColorizeEffect implements Effect {
  #params: EffectParams;

  constructor(initial: EffectParams) {
    this.#params = sanitize(definition, initial);
  }

  setParams(params: EffectParams): void {
    this.#params = sanitize(definition, { ...this.#params, ...params });
  }

  render(ctx: EffectContext): void {
    ctx.draw({
      frag: FRAG_COLORIZE,
      uniforms: {
        src: ctx.src,
        hue: this.#params.hue,
        saturation: this.#params.saturation,
        brightness: this.#params.brightness,
      },
      target: ctx.target,
    });
  }
}

export const definition: EffectDefinition = {
  id: 'colorize',
  name: 'Colorize',
  description: 'Apply a luminance-preserving hue tint.',
  order: 70,
  controls: [
    { key: 'hue', label: 'Hue', min: 0, max: 360, step: 1, value: 210 },
    { key: 'saturation', label: 'Saturation', min: 0, max: 1, step: 0.01, value: 0.7 },
    { key: 'brightness', label: 'Brightness', min: 0.25, max: 2, step: 0.01, value: 1 },
  ],
  create(params: EffectParams) {
    const effect = new ColorizeEffect(params);
    return { effect, setParams: updates => effect.setParams(updates) };
  },
};
