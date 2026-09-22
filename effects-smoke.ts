import { VFX } from '@vfx-js/core';
import { definitions } from './effects/registry';
import { MixedEffect } from './effects/mix';
import { defaults, type EffectDefinition, type EffectParams } from './effects/types';

const source = document.querySelector<HTMLCanvasElement>('#source')!;
const results = document.querySelector<HTMLElement>('#results')!;

type Pixel = [number, number, number, number];

function line(text: string, failed = false): void {
    const row = document.createElement('li');
    row.textContent = text;
    row.className = failed ? 'fail' : 'pass';
    results.append(row);
}

function drawSource(): void {
    const ctx = source.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, source.width, source.height);
    gradient.addColorStop(0, '#f2b43c');
    gradient.addColorStop(0.55, '#2bc5a2');
    gradient.addColorStop(1, '#283fc8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, source.width, source.height);
    ctx.fillStyle = '#e63232';
    ctx.fillRect(26, 58, 82, 120);
    ctx.fillStyle = '#2855e7';
    ctx.beginPath();
    ctx.arc(290, 105, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.clearRect(144, 80, 54, 72);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillRect(205, 168, 104, 30);
    ctx.clearRect(226, 198, 72, 24);
    ctx.fillStyle = 'rgba(78,160,232,0.5)';
    ctx.fillRect(226, 198, 72, 24);
}

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function outputContext(): WebGL2RenderingContext | undefined {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(canvas => canvas !== source && canvas.style.zIndex === '9999');
    return canvas?.getContext('webgl2') ?? undefined;
}

function readPixel(gl: WebGL2RenderingContext, u: number, v: number): Pixel | undefined {
    const output = gl.canvas as HTMLCanvasElement;
    const outputRect = output.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    if (!outputRect.width || !outputRect.height || !sourceRect.width || !sourceRect.height) return undefined;

    const x = Math.round((sourceRect.left - outputRect.left + u * sourceRect.width) * output.width / outputRect.width);
    const yFromTop = sourceRect.top - outputRect.top + v * sourceRect.height;
    const y = Math.round(output.height - yFromTop * output.height / outputRect.height);
    const rgba = new Uint8Array(4);
    gl.readPixels(Math.max(0, Math.min(output.width - 1, x)), Math.max(0, Math.min(output.height - 1, y)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return [rgba[0], rgba[1], rgba[2], rgba[3]];
}

function close(a: Pixel, b: Pixel, tolerance = 28): boolean {
    return a.every((value, index) => Math.abs(value - b[index]) <= tolerance);
}

function effect(id: string): EffectDefinition {
    const definition = definitions.find(item => item.id === id);
    if (!definition) throw Error(`Missing ${id} definition`);
    return definition;
}

async function main(): Promise<void> {
    drawSource();
    const vfx = new VFX({ autoplay: false, pixelRatio: 1, scrollPadding: false, zIndex: 9999 });
    let passed = 0;
    let failed = 0;

    const render = async (definition: EffectDefinition, params: EffectParams, mix: number, frames = 5, times?: number[]) => {
        const instance = definition.create(params);
        instance.reset?.();
        instance.setParams(params);
        const node = new MixedEffect(instance);
        node.enabled = true;
        node.amount = mix;
        node.targetAmount = mix;
        if (times) {
            let index = 0;
            const update = node.update.bind(node);
            node.update = ctx => update({...ctx, time: times[Math.min(index++, times.length - 1)]});
        }
        await vfx.updateEffects(source, node);
        for (let index = 0; index < frames; index += 1) {
            await frame();
            vfx.render();
        }
    };

    try {
        await vfx.add(source, { effect: [] });
        if (!outputContext()) throw Error('VFX WebGL canvas unavailable');
        // Check the requested per-frame feedback equation, fading and reset.
        for (const feedback of [0, .4, .5, 1]) {
            const trails = effect('trails').create({feedback});
            let level = 1;
            await vfx.updateEffects(source, [{
                render(ctx) {
                    ctx.draw({frag: `#version 300 es
precision highp float;
uniform float level;
out vec4 outColor;
void main(){outColor=vec4(vec3(level),1.0);}`, uniforms: {level}, target: ctx.target});
                },
            }, {
                init: ctx => trails.effect.init?.(ctx),
                render: ctx => trails.effect.render?.({...ctx, deltaTime: 1/60}),
                dispose: () => trails.effect.dispose?.(),
            }]);
            vfx.render(); // Seed white, then fade toward black.
            level = 0;
            vfx.render();
            const expected = 255*feedback*.5;
            if (!close(readPixel(outputContext()!, .5, .5)!, [expected,expected,expected,255], 3)) {
                throw Error(`Trails feedback ${feedback}: first frame does not match mix equation`);
            }
            for (let i=0;i<20;i++)vfx.render();
            const faded = readPixel(outputContext()!, .5, .5)!;
            const final = 0;
            if (!close(faded, [final,final,final,255], 3))throw Error('Trails feedback decay/hold mismatch');
            trails.reset?.();vfx.render();
            if (!close(readPixel(outputContext()!, .5, .5)!, [0,0,0,255], 2))throw Error('Trails reset retained history');
            line(`Trails feedback ${feedback}: blend, fade and reset pixel checks: pass`);
        }
        for (const definition of definitions) {
            try {
                const params = defaults(definition);
                await render(definition, params, 0.5);
                const gl = outputContext();
                const error = gl?.getError();
                if (gl && error !== undefined && error !== gl.NO_ERROR) throw Error(`WebGL error 0x${error.toString(16)}`);
                line(`${definition.name}: pass (defaults, reset, mix 0.5, 5 frames)`);
                passed += 1;
            } catch (error) {
                line(`${definition.name}: fail — ${error instanceof Error ? error.message : String(error)}`, true);
                failed += 1;
            }
        }

        const gl = outputContext();
        if (!gl) throw Error('VFX WebGL canvas unavailable during pixel checks');
        {
            await vfx.updateEffects(source, []);
            await frame();
            vfx.render();
            const left = readPixel(gl, 0.18, 0.5);
            const right = readPixel(gl, 0.82, 0.5);
            const transparent = readPixel(gl, 0.47, 0.5);
            const halfAlpha = readPixel(gl, 0.73, 0.88);
            if (!left || !right || !transparent || !halfAlpha) throw Error('Could not read VFX output pixels');
            if (transparent[3] > 4) throw Error(`Transparent-hole alpha check failed (${transparent[3]})`);
            if (halfAlpha[3] < 100 || halfAlpha[3] > 150) throw Error(`Half-alpha source check failed (${halfAlpha[3]})`);
            line('Transparent and half-alpha source checks: pass');

            await render(effect('flip'), { ...defaults(effect('flip')), horizontal: 1, vertical: 0 }, 1);
            const flippedRight = readPixel(gl, 0.82, 0.5);
            if (!flippedRight || !close(flippedRight, left)) throw Error('Flip check failed: right side did not match original left');
            line('Flip pixel check: pass');

            await render(effect('invert'), { red: 1, green: 1, blue: 1 }, 1);
            const invertedLeft = readPixel(gl, 0.18, 0.5);
            const invertedHalfAlpha = readPixel(gl, 0.73, 0.88);
            const expectedInvert: Pixel = [255 - left[0], 255 - left[1], 255 - left[2], left[3]];
            if (!invertedLeft || !invertedHalfAlpha || !close(invertedLeft, expectedInvert, 38)) throw Error('Invert check failed');
            if (Math.abs(invertedHalfAlpha[3] - halfAlpha[3]) > 4) throw Error('Invert alpha preservation check failed');
            line('Invert pixel check: pass');

            await render(effect('colorize'), { hue: 210, saturation: 0, brightness: 1 }, 1);
            const monochrome = readPixel(gl, 0.18, 0.5);
            if (!monochrome || Math.max(monochrome[0], monochrome[1], monochrome[2]) - Math.min(monochrome[0], monochrome[1], monochrome[2]) > 5) {
                throw Error('Colorize grayscale check failed');
            }
            line('Colorize grayscale pixel check: pass');

            // Known source pixels verify every palette and folding AFTER the time offset.
            const luma = (.299*left[0]+.587*left[1]+.114*left[2])/255;
            const paletteColor = (index:number,t:number):Pixel => {
                const pairs = [[[1,0,0],[0,0,1]], [[1,1,0],[1,.1,.6]], [[0,1,1],[.6,0,1]], [[1,1,1],[0,0,0]]];
                const rgb = index===0 ? [0,2/3,1/3].map(offset=>Math.max(0,Math.min(1,Math.abs(((t+offset)%1)*6-3)-1)))
                    : pairs[index-1][0].map((value,i)=>value*(1-t)+pairs[index-1][1][i]*t);
                return [rgb[0]*255,rgb[1]*255,rgb[2]*255,255];
            };
            for(let palette=0;palette<5;palette++)for(const frequency of [0,1,4]){
                const instance=effect('colorama').create({palette,frequency,speed:1});
                let delta=0;
                await vfx.updateEffects(source, {render:ctx=>instance.effect.render?.({...ctx,deltaTime:delta})});
                vfx.render();
                if(!close(readPixel(gl,.18,.5)!,paletteColor(palette,1-Math.abs(((luma*frequency)%2)-1)),5))throw Error('Colorama static palette mismatch: '+palette);
                delta=.25;
                for(let i=0;i<3;i++)vfx.render();
                const folded=1-Math.abs(((luma*frequency+.75)%2)-1);
                if(!close(readPixel(gl,.18,.5)!,paletteColor(palette,folded),5))throw Error('Colorama animated fold mismatch: '+palette);
                if(readPixel(gl,.47,.5)![3]>4 || Math.abs(readPixel(gl,.73,.88)![3]-halfAlpha[3])>4)throw Error('Colorama lost alpha');
                instance.setParams({speed:0});
                const frozen=readPixel(gl,.18,.5)!;vfx.render();
                if(!close(readPixel(gl,.18,.5)!,frozen,1))throw Error('Colorama zero speed did not freeze');
                instance.reset?.();vfx.render();
                if(!close(readPixel(gl,.18,.5)!,paletteColor(palette,1-Math.abs(((luma*frequency)%2)-1)),5))throw Error('Colorama reset failed');
            }
            line('Colorama: five palettes, frequency 0/1/4, fold after animation, zero-speed hold, alpha and reset: pass');

            const strobe = effect('strobe');
            for (const white of [0, 1]) {
                await render(strobe, {...defaults(strobe), duty: 1, white}, 1);
                const solid = readPixel(gl, 0.18, 0.5)!;
                const half = readPixel(gl, 0.73, 0.88)!;
                const hole = readPixel(gl, 0.47, 0.5)!;
                if (!close(solid, [white*255,white*255,white*255,left[3]], 4)) throw Error('Strobe black/white pixel mismatch');
                if (Math.abs(half[3]-halfAlpha[3])>4 || hole[3]>4) throw Error('Strobe lost alpha');
            }
            for (const params of [{frequency:0}, {amount:0}, {duty:0}] as EffectParams[]) {
                await render(strobe, {...defaults(strobe), ...params}, 1);
                if (!close(readPixel(gl, 0.18, 0.5)!, left, 4)) throw Error('Strobe bypass mismatch');
            }
            line('Strobe: black/white, alpha preservation, zero frequency/amount/duty: pass');

            // Opaque vertical bars make empty edges and accidental rotation visible.
            const ctx = source.getContext('2d')!;
            for (let x = 0; x < source.width; x++) {
                ctx.fillStyle = Math.floor(x / 12) % 2 ? '#ffffff' : '#203080';
                ctx.fillRect(x, 0, 1, source.height);
            }
            // Canvas sources upload on registration (unlike live video).
            vfx.remove(source);
            await vfx.add(source, {effect: []});
            const twitch = effect('twitch');
            const sharp = {...defaults(twitch), posX: 0.45, posY: 0, posFreq: 1, threshold: 0.1,
                scaleAmount: 0, rgbAmount: 0, lightAmount: 0, blurAmount: 0};
            for (const wrap of [0, 1]) {
                await render(twitch, {...sharp, wrap}, 1, 2, [0, 0.055]);
                for (const u of [0.01, 0.25, 0.5, 0.75, 0.99]) {
                    const top = readPixel(gl, u, 0.05)!;
                    const bottom = readPixel(gl, u, 0.95)!;
                    if (top[3] < 250 || bottom[3] < 250) throw Error('Twitch introduced transparent edges');
                    if (!close(top, bottom, 2)) throw Error('Horizontal Twitch rotated or skewed the bars');
                }
            }
            await render(twitch, {...sharp, wrap: 0}, 1, 2, [0, 0.055]);
            const positions = Array.from({length: 32}, (_, i) => (i + 0.5) / 32);
            const sharpPixels = positions.map(u => readPixel(gl, u, 0.5)!);
            await render(twitch, {...sharp, wrap: 0, blurAmount: 1}, 1, 2, [0, 0.055]);
            const blurred = positions.map(u => readPixel(gl, u, 0.5)!);
            if (!blurred.some((pixel, i) => !close(pixel, sharpPixels[i], 15))) throw Error('Twitch blur has no visible effect');
            if (blurred.some(pixel => pixel[3] < 250)) throw Error('Twitch blur lost opacity');
            line('Twitch: Repeat/Hold opaque edges, no rotation, directional blur: pass');
            const neutral = {...defaults(twitch), posFreq: 0, scaleFreq: 0, rgbFreq: 0,
                lightFreq: 0, blurAmount: 0, threshold: 0.1};
            await render(twitch, neutral, 1, 2, [0, 0.055]);
            const baseline = positions.map(u => readPixel(gl, u, 0.5)!);
            for (const channel of ['scale', 'rgb', 'light']) {
                let changed = false;
                for (const time of [0.025, 0.055, 0.095]) {
                    await render(twitch, {...neutral, [channel + 'Freq']: 1, [channel + 'Amount']: 1}, 1, 2, [0, time]);
                    const pixels = positions.map(u => readPixel(gl, u, 0.5)!);
                    if (pixels.some(pixel => pixel[3] < 250)) throw Error('Twitch channel lost alpha: ' + channel);
                    changed ||= pixels.some((pixel, i) => !close(pixel, baseline[i], 10));
                }
                if (!changed) throw Error('Twitch channel did not render independently: ' + channel);
            }
            line('Twitch: independent Scale / RGB / Light pixel checks: pass');

            // A non-repeating opaque pattern exposes 2D offsets/scales and edges.
            const pixels = ctx.createImageData(source.width, source.height);
            for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
                const i = (y * source.width + x) * 4;
                pixels.data.set([x / source.width * 255, y / source.height * 255,
                    ((x >> 3) ^ (y >> 3)) % 2 * 180 + 40, 255], i);
            }
            ctx.putImageData(pixels, 0, 0);
            vfx.remove(source); await vfx.add(source, {effect: []});
            const glitch = effect('shift-glitch');
            const settings = {...defaults(glitch), frequency: 30, size: 24, vertical: 0, horizontal: 0};
            const capture = async (params: EffectParams, time: number) => {
                await render(glitch, params, 1, 2, [0, time]);
                return Array.from({length:128}, (_,i)=>readPixel(gl, ((i%16)+0.5)/16, (Math.floor(i/16)+0.5)/8)!);
            };
            const original = await capture(settings, 0.01);
            const partial = {...settings, vertical:.2, horizontal:.2};
            const first = await capture(partial, 0.01);
            const held = await capture(partial, 0.02);
            const next = await capture(partial, 0.095);
            if (!first.every((p,i)=>close(p,held[i],1))) throw Error('Shift Glitch animates within an update');
            if (first.every((p,i)=>close(p,next[i],2))) throw Error('Shift Glitch masks did not update');
            const affected = first.filter((p,i)=>!close(p,original[i],3)).length;
            if (affected < 2 || affected > 110) throw Error('Shift Glitch must affect only part of the image');
            if (first.some(p=>p[3]<250)) throw Error('Shift Glitch repeat wrapping introduced empty edges');
            const full = {...settings, vertical:1, horizontal:1};
            const fullFirst = await capture(full, 0.01), fullNext = await capture(full, 0.095);
            if (fullFirst.every((p,i)=>close(p,fullNext[i],2))) throw Error('Shift Glitch full-coverage pattern did not change');
            const frozen = {...full, frequency:0};
            const frozenFirst = await capture(frozen, .01), frozenNext = await capture(frozen, .095);
            if (!frozenFirst.every((p,i)=>close(p,frozenNext[i],1))) throw Error('Shift Glitch zero frequency must freeze the pattern');
            if (fullFirst.some(p=>p[3]<250)) throw Error('Shift Glitch overlap lost opacity');
            for (const axis of ['vertical','horizontal']) {
                const solo = await capture({...settings,[axis]:.3},0.01);
                const count = solo.filter((p,i)=>!close(p,original[i],3)).length;
                if (count<1 || count>120) throw Error('Shift Glitch independent axis coverage failed: '+axis);
            }
            line('Shift Glitch: partial coverage, independent axes, held frames, refreshed patterns, zero-frequency freeze, repeat: pass');



        }
    } catch (error) {
        failed += 1;
        line(`Harness failure — ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
        line(`${failed ? 'FAIL' : 'PASS'}: ${passed}/${definitions.length} effect smoke checks passed${failed ? `; ${failed} failure(s)` : ''}`, failed > 0);
        vfx.stop();
    }
}

void main();
