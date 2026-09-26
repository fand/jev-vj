import type { Effect, EffectContext } from '@vfx-js/core';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types.js';

const FRAG_HATCHED = `#version 300 es
precision highp float;

in vec2 uvContent;
out vec4 outColor;

uniform sampler2D src;
uniform vec4 srcRectUv;
uniform vec2 elementPx;
uniform float lineWidth;
uniform float spacing;
uniform float angle;
uniform int levels;
uniform float invert;

float layerAngle(int layer) {
    if (layer == 0) return 0.0;
    if (layer == 1) return 90.0;
    if (layer == 2) return 45.0;
    return 135.0;
}

float hatchLine(vec2 pixel, float degrees) {
    float radians = degrees * 0.01745329252;
    float coordinate = dot(pixel, vec2(cos(radians), sin(radians)));
    float distanceToLine = abs(fract(coordinate / spacing) - 0.5) * spacing;
    float antialias = max(0.5, fwidth(distanceToLine));
    return 1.0 - smoothstep(lineWidth * 0.5 - antialias, lineWidth * 0.5 + antialias, distanceToLine);
}

void main() {
    vec4 source = texture(src, srcRectUv.xy + uvContent * srcRectUv.zw);
    // The source is premultiplied; restore colour before measuring luminance.
    vec3 rgb = source.a > 0.0 ? source.rgb / source.a : vec3(0.0);
    float darkness = 1.0 - dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    float coverage = 0.0;
    vec2 pixel = uvContent * elementPx;

    for (int layer = 0; layer < 4; ++layer) {
        if (layer >= levels) break;
        float threshold = (float(layer) + 0.5) / float(levels);
        float strength = smoothstep(threshold - 0.08, threshold + 0.08, darkness);
        coverage = max(coverage, hatchLine(pixel, angle + layerAngle(layer)) * strength);
    }

    vec3 paper = invert > 0.5 ? vec3(0.0) : vec3(1.0);
    vec3 ink = invert > 0.5 ? vec3(1.0) : vec3(0.0);
    // Keep the source silhouette and premultiplied-alpha contract intact.
    outColor = vec4(mix(paper, ink, coverage) * source.a, source.a);
}
`;

const controls = [
    { key: 'lineWidth', label: 'Line width', min: 0.25, max: 12, step: 0.25, value: 1.25 },
    { key: 'spacing', label: 'Line spacing', min: 4, max: 80, step: 1, value: 14 },
    { key: 'angle', label: 'Angle', min: -180, max: 180, step: 1, value: 20 },
    { key: 'levels', label: 'Levels', min: 1, max: 4, step: 1, value: 3 },
    { key: 'invert', label: 'Invert paper', min: 0, max: 1, step: 1, value: 0 },
] as const;

class HatchedEffect implements Effect {
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
            frag: FRAG_HATCHED,
            uniforms: {
                src: ctx.src,
                elementPx: [width || 1, height || 1],
                lineWidth: this.#params.lineWidth,
                spacing: this.#params.spacing,
                angle: this.#params.angle,
                levels: Math.round(this.#params.levels),
                invert: this.#params.invert,
            },
            target: ctx.target,
        });
    }
}

export const definition: EffectDefinition = {
    id: 'hatched',
    name: 'Hatched',
    description: 'Luminance-based crosshatching on light paper, with an inverted paper mode.',
    order: 20,
    controls: [...controls],
    create(params: EffectParams) {
        const effect = new HatchedEffect({ ...defaults(definition), ...params });
        return { effect, setParams: updates => effect.setParams(updates) };
    },
};
