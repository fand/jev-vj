import { HalftoneEffect } from '@vfx-js/effects';
import { defaults, sanitize, type EffectDefinition, type EffectParams } from './types';

const controls = [
  { key: 'gridSize', label: 'Grid size', min: 4, max: 32, step: 1, value: 12 },
  { key: 'dotSize', label: 'Dot size', min: 0.35, max: 1.2, step: 0.05, value: 0.8 },
  { key: 'angle', label: 'Angle', min: -45, max: 45, step: 1, value: 0 },
  { key: 'smoothing', label: 'Dot softness', min: 0, max: 0.4, step: 0.01, value: 0.12 },
  { key: 'blackAmount', label: 'Black ink', min: 0, max: 1, step: 0.05, value: 0.75 },
  { key: 'cmyk', label: 'CMYK mode', min: 0, max: 1, step: 1, value: 1 },
  { key: 'inkPreset', label: 'Ink preset', min: 0, max: 3, step: 1, value: 1 },
] as const;

const presetNames = ['pure', 'newsprint', 'fogra51', 'swop'] as const;

export const definition: EffectDefinition = {
  id: 'halftone',
  name: 'Halftone',
  description: 'Print-style RGB or CMYK dot screen.',
  order: 20,
  controls: [...controls],
  create(params: EffectParams) {
    let current = sanitize(definition, { ...defaults(definition), ...params });
    const effect = new HalftoneEffect();

    const setParams = (updates: EffectParams) => {
      current = sanitize(definition, { ...current, ...updates });
      effect.setParams({
        gridSize: current.gridSize,
        dotSize: current.dotSize,
        angle: current.angle,
        smoothing: current.smoothing,
        blackAmount: current.blackAmount,
        mode: current.cmyk >= 0.5 ? 'cmyk' : 'rgb',
      });
      effect.setInkPreset('pure');
      effect.setInkPreset(presetNames[Math.round(current.inkPreset)]);
    };

    setParams({});
    return { effect, setParams };
  },
};
