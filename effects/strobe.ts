import type { Effect, EffectContext } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types';

const FRAG = `#version 300 es
precision highp float;
in vec2 uvContent;
uniform sampler2D src;
uniform vec4 srcRectUv;
uniform float flash;
uniform float level;
out vec4 outColor;
void main() {
  vec4 color = texture(src, srcRectUv.xy + uvContent * srcRectUv.zw);
  outColor = vec4(mix(color.rgb, vec3(level * color.a), flash), color.a);
}`;

class StrobeEffect implements Effect {
  private params: EffectParams;
  private phase = 0;
  constructor(params: EffectParams) { this.params = sanitize(definition, params); }
  setParams(params: EffectParams) { this.params = sanitize(definition, {...this.params, ...params}); }
  reset() { this.phase = 0; }
  update(ctx: EffectContext) {
    // Integrate frequency so live edits preserve phase; time is in seconds, not frames.
    this.phase = (this.phase + Math.max(0, ctx.deltaTime) * this.params.frequency) % 1;
  }
  render(ctx: EffectContext) {
    const {frequency, duty, amount, white} = this.params;
    ctx.draw({frag: FRAG, target: ctx.target, uniforms: {
      src: ctx.src, flash: frequency > 0 && this.phase < duty ? amount : 0,
      level: Math.round(white),
    }});
  }
}

export const definition: EffectDefinition = {
  id: 'strobe', name: 'Strobe', order: 80,
  description: 'Periodic hard flashes to black or white. Frequency in Hz; duty is the fraction of each cycle spent flashing. Preserves source alpha.',
  controls: [
    {key:'frequency', label:'Frequency (Hz)', min:0, max:30, step:0.1, value:8},
    {key:'duty', label:'Flash duty', min:0, max:1, step:0.01, value:0.5},
    {key:'amount', label:'Amount', min:0, max:1, step:0.01, value:1},
    {key:'white', label:'White flash (0 = black)', min:0, max:1, step:1, value:0},
  ],
  create(params) {
    const effect = new StrobeEffect(params);
    return {effect, setParams: updates => effect.setParams(updates), reset: () => effect.reset()};
  },
};
