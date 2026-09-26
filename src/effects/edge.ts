import { ColoredEdgesEffect } from '@vfx-js/effects';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types';

const palettes = [
  { color1: '#ffffff', color2: '#ffffff', background: '#000000' },
  { color1: '#8fe9ff', color2: '#1464d2', background: '#020816' },
  { color1: '#ffddb8', color2: '#e51c23', background: '#140204' },
  { color1: '#00ffe1', color2: '#ff27dc', background: '#08000e' },
] as const;

export const definition: EffectDefinition = {
  id: 'edge',
  name: 'Edge',
  description: 'Sobel-detected outlines in a selected palette.',
  order: 25,
  controls: [
    { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, value: 0.2 },
    { key: 'thickness', label: 'Thickness', min: 0.5, max: 10, step: 0.5, value: 1.5 },
    { key: 'intensity', label: 'Intensity', min: 0, max: 10, step: 0.1, value: 3 },
    { key: 'palette', label: 'Palette: 0 white, 1 blue, 2 red, 3 neon', min: 0, max: 3, step: 1, value: 0 },
    { key: 'sourceMix', label: 'Source over edges', min: 0, max: 1, step: 0.01, value: 0 },
  ],
  create(params: EffectParams) {
    let current = sanitize(definition, { ...defaults(definition), ...params });
    const effect = new ColoredEdgesEffect();

    const setParams = (updates: EffectParams) => {
      current = sanitize(definition, { ...current, ...updates });
      effect.setParams({
        threshold: current.threshold,
        thickness: current.thickness,
        intensity: current.intensity,
        opacity: current.sourceMix,
        ...palettes[Math.round(current.palette)],
      });
    };

    setParams({});
    return { effect, setParams };
  },
};
