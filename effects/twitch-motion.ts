import type { EffectParams } from './types';

export const channels = ['pos', 'scale', 'rgb', 'light'] as const;
export type TwitchPhases = [number, number, number, number];
// Frequency is noise bandwidth, not an event clock. Zero disables the channel.
export function noiseRate(frequency: number): number {
    return frequency <= 0 ? 0 : 0.5 + 30 * frequency * frequency;
}
function hash(index: number, seed: number, stream: number): number {
    let x = (index | 0) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(stream, 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
export function noise(time: number, seed: number, stream: number): number {
    const i = Math.floor(time), t = time - i;
    const blend = t * t * t * (t * (t * 6 - 15) + 10);
    return hash(i, seed, stream) * (1 - blend) + hash(i + 1, seed, stream) * blend;
}
function smoothstep(low: number, high: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - low) / (high - low)));
    return t * t * (3 - 2 * t);
}
export function gate(phase: number, frequency: number, seed: number, stream: number, threshold: number): number {
    if (frequency <= 0) return 0;
    // A narrow transition gives crisp onsets without turning every lattice cell
    // into an event. Random runs can stay silent or active across several cells.
    return smoothstep(threshold, Math.min(1, threshold + 0.04), noise(phase, seed, stream));
}
export function sampleMotion(phases: TwitchPhases, p: EffectParams) {
    const gates = channels.map((name, i) => gate(phases[i], p[name + 'Freq'], p.seed, 10 + i * 11, p.threshold));
    const signed = (i: number, stream: number) => noise(phases[i] * 1.73 + 23, p.seed, stream) * 2 - 1;
    const strength = p.global;
    return {
        x: p.posX * strength * gates[0] * signed(0, 101),
        y: p.posY * strength * gates[0] * signed(0, 102),
        scale: 1 + p.scaleAmount * 2 * strength * gates[1] * Math.abs(signed(1, 103)),
        rgbX: p.rgbAmount * 0.08 * strength * gates[2] * signed(2, 104),
        rgbY: p.rgbAmount * 0.08 * strength * gates[2] * signed(2, 105),
        light: 2 ** (p.lightAmount * 2 * strength * gates[3]),
    };
}

// Constant shutter duration: only Pos/Scale are sampled over time. RGB and Light
// retain their current instantaneous values, independently of motion blur.
export function sampleShutter(phases: TwitchPhases, p: EffectParams) {
    const current = sampleMotion(phases, p);
    const moving = p.global > 0 && ((p.posFreq > 0 && (p.posX > 0 || p.posY > 0)) || (p.scaleFreq > 0 && p.scaleAmount > 0));
    const count = p.blurAmount > 0 && moving ? 16 : 1;
    const poses = Array.from({length: count}, (_, i) => {
        const ago = count === 1 ? 0 : i / 15 * p.blurAmount / 30;
        const samplePhases = phases.map((phase, j) => j < 2
            ? Math.max(0, phase - ago * noiseRate(p[channels[j] + 'Freq'])) : phase) as TwitchPhases;
        const sample = i === 0 ? current : sampleMotion(samplePhases, p);
        return [sample.x, sample.y, sample.scale, 0];
    });
    return {current, poses};
}
