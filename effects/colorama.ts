import type { Effect } from '@vfx-js/core';
import { sanitize, type EffectDefinition, type EffectParams } from './types';

const FRAG = `#version 300 es
precision highp float;
in vec2 uvSrc;
out vec4 outColor;
uniform sampler2D src;
uniform int paletteIndex;
uniform float phase;
uniform float frequency;

vec3 palette(float t) {
  if (paletteIndex == 1) return mix(vec3(1,0,0), vec3(0,0,1), t);
  if (paletteIndex == 2) return mix(vec3(1,1,0), vec3(1,0.1,0.6), t);
  if (paletteIndex == 3) return mix(vec3(0,1,1), vec3(0.6,0,1), t);
  if (paletteIndex == 4) return vec3(1.0 - t);
  // Full hue spectrum: red, yellow, green, cyan, blue, magenta, red.
  return clamp(abs(fract(t + vec3(0.0, 2.0/3.0, 1.0/3.0))*6.0-3.0)-1.0, 0.0, 1.0);
}
void main() {
  vec4 color = texture(src, uvSrc);
  vec3 rgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);
  float gray = dot(rgb, vec3(0.299, 0.587, 0.114));
  float x = gray * frequency + phase;
  float folded = 1.0 - abs(mod(x, 2.0) - 1.0);
  outColor = vec4(palette(folded) * color.a, color.a);
}
`;

export const definition: EffectDefinition = {
  id: 'colorama', name: 'Colorama', order: 50,
  description: 'Remap grayscale through a folded animated palette. Rainbow adds many colors; paired palettes use two colors; white-black is monochrome. Preserves alpha.',
  controls: [
    {key:'palette', label:'Palette', min:0, max:4, step:1, value:0,
      options:['Rainbow','Red–Blue','Yellow–Pink','Cyan–Purple','White–Black']},
    {key:'frequency', label:'Frequency', min:0, max:10, step:0.1, value:1},
    {key:'speed', label:'Speed', min:0, max:1, step:0.01, value:0.08},
  ],
  create(initial: EffectParams) {
    let params = sanitize(definition, initial);
    let phase = 0;
    const effect: Effect = {
      render(ctx) {
        phase = (phase + Math.min(Math.max(ctx.deltaTime,0),.25)*params.speed) % 2;
        ctx.draw({frag:FRAG, uniforms:{src:ctx.src, paletteIndex:Math.round(params.palette), frequency:params.frequency, phase}, target:ctx.target});
      },
    };
    return {effect, setParams(updates){params=sanitize(definition,{...params,...updates});}, reset(){phase=0;}};
  },
};
