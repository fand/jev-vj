import type { Effect } from '@vfx-js/core';
import { channels, noiseRate, sampleShutter, type TwitchPhases } from './twitch-motion';
import { sanitize, type Control, type EffectDefinition, type EffectParams } from './types';

const FRAG = `#version 300 es
precision highp float;
in vec2 uvContent;
out vec4 outColor;
uniform sampler2D src;
uniform vec4 srcRectUv;
uniform vec4 poses[16];
uniform vec3 color;
uniform int sampleCount;
uniform float wrapMode;
uniform float amount;
vec4 readSource(vec2 uv) {
    vec2 inset = min(vec2(0.5), 0.5 / max(vec2(textureSize(src, 0)) * srcRectUv.zw, vec2(1.0)));
    uv = wrapMode < 0.5 ? fract(uv) : clamp(uv, 0.0, 1.0);
    return texture(src, srcRectUv.xy + clamp(uv, inset, 1.0 - inset) * srcRectUv.zw);
}
void main() {
    vec4 dry = readSource(uvContent);
    if (amount <= 0.0) { outColor = dry; return; }
    vec4 wet = vec4(0.0);
    for (int i = 0; i < 16; ++i) {
        if (i >= sampleCount) break;
        vec2 uv = (uvContent - 0.5) / poses[i].z + 0.5 + poses[i].xy;
        vec4 base = readSource(uv);
        if (dot(color.xy, color.xy) > 0.000000001) {
            vec4 red = readSource(uv + color.xy);
            vec4 blue = readSource(uv - color.xy);
            // Sample straight colors, then restore the center sample's alpha.
            base.r = red.a > 0.00001 ? red.r / red.a * base.a : 0.0;
            base.b = blue.a > 0.00001 ? blue.b / blue.a * base.a : 0.0;
        }
        base.rgb = clamp(base.rgb * color.z, vec3(0.0), vec3(base.a));
        wet += base;
    }
    outColor = mix(dry, wet / float(sampleCount), amount);
}
`;
const control = (key: string, label: string, value: number): Control => ({key, label, min: 0, max: 1, step: 0.01, value});
const controls: Control[] = [
    control('global', 'Global Twitch', 1),
    control('posX', 'Pos amount X', 0.25), control('posY', 'Pos amount Y', 0.04), control('posFreq', 'Pos frequency', 0.4),
    control('scaleAmount', 'Scale amount', 0.15), control('scaleFreq', 'Scale frequency', 0.25),
    control('rgbAmount', 'RGB shift amount', 0.2), control('rgbFreq', 'RGB frequency', 0.3),
    control('lightAmount', 'Light amount', 0.35), control('lightFreq', 'Light frequency', 0.2),
    control('blurAmount', 'Motion blur', 0.8),
    {key: 'threshold', label: 'Noise threshold', min: 0.1, max: 0.95, step: 0.01, value: 0.65},
    {key: 'wrap', label: 'Wrap (0 Repeat / 1 Hold)', min: 0, max: 1, step: 1, value: 0},
    {key: 'seed', label: 'Seed', min: 0, max: 9999, step: 1, value: 1},
    control('mix', 'Mix', 1),
];
function create(initial: EffectParams) {
    let params = sanitize(definition, initial);
    let phases: TwitchPhases = [0, 0, 0, 0];
    let lastTime: number | undefined;
    // Reused typed arrays: sample the trajectory once per frame on CPU, not per pixel.
    const poses = new Float32Array(64);
    const reset = () => { phases = [0, 0, 0, 0]; lastTime = undefined; };
    const effect: Effect = {
        update(ctx) {
            const dt = lastTime === undefined ? 0 : Math.min(0.1, Math.max(0, ctx.time - lastTime));
            lastTime = ctx.time;
            channels.forEach((channel, i) => { phases[i] += dt * noiseRate(params[channel + 'Freq']); });
        },
        render(ctx) {
            const shutter = sampleShutter(phases, params);
            shutter.poses.forEach((pose, i) => poses.set(pose, i * 4));
            const {current} = shutter;
            const color: [number, number, number] = [current.rgbX, current.rgbY, current.light];
            ctx.draw({frag: FRAG, uniforms: {src: ctx.src, poses, color, sampleCount: shutter.poses.length,
                wrapMode: params.wrap, amount: params.mix}, target: ctx.target});
        },
    };
    return {effect, reset, setParams(updates: EffectParams) {
        const next = sanitize(definition, {...params, ...updates});
        if (next.seed !== params.seed) reset();
        params = next;
    }};
}
export const definition: EffectDefinition = {
    id: 'twitch', name: 'Twitch', order: 30, controls, create,
    description: 'Independent noise-gated position, scale, RGB separation and light bursts, each with amount and frequency. Constant motion blur follows position/scale speed. Non-periodic; no rotation; Repeat or Hold edges.',
};
