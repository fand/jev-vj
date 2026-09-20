import type { Effect, EffectContext, EffectRenderTarget } from '@vfx-js/core';
import type { EffectInstance } from './types';
const FRAG = `#version 300 es
precision highp float;
in vec2 uvSrc; in vec2 uvContent;
uniform sampler2D src; uniform sampler2D wet; uniform float amount;
out vec4 outColor;
void main(){ outColor=mix(texture(src,uvSrc),texture(wet,uvContent),amount); }`;

// Each adapter renders into its own target; the outer stage owns dry/wet mixing.
export class MixedEffect implements Effect {
  enabled = false;
  amount = 1;
  targetAmount = 1;
  private rt?: EffectRenderTarget;
  constructor(readonly instance: EffectInstance) {}
  async init(ctx: EffectContext) { await this.instance.effect.init?.(ctx); }
  update(ctx: EffectContext) {
    this.amount += (this.targetAmount-this.amount)*(1-Math.exp(-Math.min(ctx.deltaTime, .1)*10));
    if(this.enabled) this.instance.effect.update?.(ctx);
  }
  render(ctx: EffectContext) {
    if(!this.instance.effect.render) {ctx.blit(ctx.src,ctx.target);return;}
    if(this.amount>.999 && this.targetAmount===1) { this.instance.effect.render(ctx);return; }
    this.rt ??= ctx.createRenderTarget();
    this.instance.effect.render({...ctx,target:this.rt});
    ctx.draw({frag:FRAG,uniforms:{src:ctx.src,wet:this.rt,amount:this.amount},target:ctx.target});
  }
  dispose() {this.instance.effect.dispose?.();this.rt?.dispose();this.rt=undefined;}
}
