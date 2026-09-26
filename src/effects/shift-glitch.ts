import type { Effect } from '@vfx-js/core';
import { sanitize, type Control, type EffectDefinition, type EffectParams } from './types';

const FRAG = `#version 300 es
precision highp float;
precision highp int;
in vec2 uvContent;
out vec4 outColor;
uniform sampler2D src;
uniform vec4 srcRectUv;
uniform vec2 resolution;
uniform float size;
uniform int eventIndex;
uniform int seed;
uniform float vertical;
uniform float horizontal;
uniform float mixAmount;

float randomBand(int band, int axis, int stream, int epoch) {
    uint x = uint(band) ^ (uint(seed) * 0x9e3779b1u)
        ^ (uint(axis + 1) * 0x85ebca6bu) ^ (uint(stream) * 0xc2b2ae35u)
        ^ (uint(epoch) * 0x27d4eb2du);
    x = (x ^ (x >> 16)) * 0x7feb352du;
    x = (x ^ (x >> 15)) * 0x846ca68bu;
    return float((x ^ (x >> 16)) & 0x00ffffffu) / 16777216.0;
}
float boundary(int band, int axis) {
    // Sorted jittered boundaries: widths vary from 0.04x to 1.96x base size.
    // Each event redraws the layout; it stays still until the next event.
    return float(band) + 0.02 + 0.96 * randomBand(band, axis, 1, eventIndex + 1);
}
vec2 transformBand(vec2 original, vec2 transformed, int axis, float coverage) {
    if (coverage <= 0.0) return transformed;
    float pixels = axis == 0 ? resolution.x : resolution.y;
    float coordinate = (axis == 0 ? original.x : original.y) * pixels / size;
    int band = int(floor(coordinate));
    if (coordinate < boundary(band, axis)) band -= 1;
    // Each event changes both the layout and active mask. Coverage is probabilistic:
    // e.g. 0.2 affects approximately 20% per axis over many bands/updates.
    if (randomBand(band, axis, 2, eventIndex + 1) >= coverage) return transformed;
    float center = (boundary(band, axis) + boundary(band + 1, axis)) * 0.5 * size / pixels;
    vec2 anchor = axis == 0 ? vec2(center, 0.5) : vec2(0.5, center);
    vec2 offset = (vec2(randomBand(band, axis, 3, eventIndex + 1), randomBand(band, axis, 4, eventIndex + 1)) * 2.0 - 1.0) * 0.35;
    vec2 scale = exp2((vec2(randomBand(band, axis, 5, eventIndex + 1), randomBand(band, axis, 6, eventIndex + 1)) * 2.0 - 1.0) * 1.5);
    return (transformed - anchor) / scale + anchor + offset;
}
vec4 readSource(vec2 uv) {
    vec2 inset = min(vec2(0.5), 0.5 / max(vec2(textureSize(src, 0)) * srcRectUv.zw, vec2(1.0)));
    return texture(src, srcRectUv.xy + clamp(fract(uv), inset, 1.0 - inset) * srcRectUv.zw);
}
void main() {
    vec2 shifted = transformBand(uvContent, uvContent, 0, vertical);
    // Membership always uses original UV, so displaced vertical strips cannot
    // move the horizontal mask. At intersections the two transforms compose.
    shifted = transformBand(uvContent, shifted, 1, horizontal);
    outColor = mix(readSource(uvContent), readSource(shifted), mixAmount);
}
`;
const controls: Control[] = [
    {key:'frequency', label:'Frequency (Hz)', min:0, max:30, step:0.1, value:12},
    {key:'vertical', label:'Vertical coverage', min:0, max:1, step:0.01, value:0.12},
    {key:'horizontal', label:'Horizontal coverage', min:0, max:1, step:0.01, value:0.25},
    {key:'size', label:'Base band width (px)', min:2, max:480, step:1, value:48},
    {key:'seed', label:'Seed', min:0, max:9999, step:1, value:1},
    {key:'mix', label:'Mix', min:0, max:1, step:0.01, value:1},
];
function create(initial: EffectParams) {
    let params = sanitize(definition, initial);
    let phase = 0, lastTime: number | undefined;
    const reset = () => { phase=0; lastTime=undefined; };
    const effect: Effect = {
        update(ctx) {
            const dt = lastTime === undefined ? 0 : Math.min(0.1, Math.max(0, ctx.time-lastTime));
            lastTime = ctx.time;
            phase += dt * params.frequency;
        },
        render(ctx) {
            const [width,height] = ctx.dims.elementPixel;
            ctx.draw({frag:FRAG, uniforms:{src:ctx.src, resolution:[width||1,height||1],
                size:params.size, eventIndex:Math.floor(phase), seed:Math.round(params.seed),
                vertical:params.vertical, horizontal:params.horizontal, mixAmount:params.mix}, target:ctx.target});
        },
    };
    return {effect, reset, setParams(updates: EffectParams) {
        const next = sanitize(definition,{...params,...updates});
        if(next.seed!==params.seed)reset();
        params=next;
    }};
}
export const definition: EffectDefinition = {
    id:'shift-glitch', name:'Shift Glitch', order:30, controls, create,
    description:'Partial vertical and horizontal bands of irregular width. Independent per-axis coverage. Band boundaries, active masks, and random 2D UV offsets/scales refresh at 0–30 Hz and hold between updates. Repeat wrapping; 0 Hz freezes the pattern.',
};
