import type { Effect, EffectContext } from '@vfx-js/core';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_LOREZ = `#version 300 es
precision highp float;

in vec2 uvContent;
out vec4 outColor;

uniform sampler2D src;
uniform vec4 srcRectUv;
uniform vec2 elementPx;
uniform float pixelSize;
uniform float colorLevels;

void main() {
    // Work in physical element pixels so blocks remain square at any aspect ratio.
    vec2 cell = (floor(uvContent * elementPx / pixelSize) + 0.5) * pixelSize;
    vec2 sampleUv = clamp(cell / elementPx, 0.0, 1.0);
    vec4 source = texture(src, srcRectUv.xy + sampleUv * srcRectUv.zw);

    // Quantize unpremultiplied colour, then restore the source alpha contract.
    vec3 rgb = source.a > 0.0 ? source.rgb / source.a : vec3(0.0);
    float steps = max(2.0, colorLevels) - 1.0;
    vec3 quantized = floor(rgb * steps + 0.5) / steps;
    outColor = vec4(quantized * source.a, source.a);
}
`;

const controls = [
    { key: 'pixelSize', label: 'Pixel size', min: 1, max: 128, step: 1, value: 8 },
    { key: 'colorLevels', label: 'Color levels', min: 2, max: 32, step: 1, value: 8 },
] as const;

class LoRezEffect implements Effect {
    #params: EffectParams;

    constructor(initial: EffectParams) {
        this.#params = sanitize(definition, initial);
    }

    setParams(params: EffectParams): void {
        this.#params = sanitize(definition, { ...this.#params, ...params });
    }

    render(ctx: EffectContext): void {
        const [width, height] = ctx.dims.elementPixel;
        ctx.draw({
            frag: FRAG_LOREZ,
            uniforms: {
                src: ctx.src,
                elementPx: [width || 1, height || 1],
                pixelSize: this.#params.pixelSize,
                colorLevels: Math.round(this.#params.colorLevels),
            },
            target: ctx.target,
        });
    }
}

export const definition: EffectDefinition = {
    id: 'lorez',
    name: 'LoRez',
    description: 'Square pixel blocks with per-channel colour quantization.',
    order: 20,
    controls: [...controls],
    create(params: EffectParams) {
        const effect = new LoRezEffect({ ...defaults(definition), ...params });
        return { effect, setParams: updates => effect.setParams(updates) };
    },
};
