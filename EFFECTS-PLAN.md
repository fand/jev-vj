# VFX-JS effects integration plan

Status: implemented (2026-09-19). See PLAYER.md for operation.

Implementation notes: all 14 effects, manual controls, clip lock, staged Jev
selection and presentation acknowledgements are implemented. The actual catalog
is `effects/controls.json` plus named semantic presets in `effect_selection.py`;
effect adapters live directly under `effects/`. LoRez is one custom shader.
New-effect mix fades in; general parameter interpolation, removal/topology
crossfades and a temporary A/B bypass UI remain follow-ups. There is no hard
0–3-effect cap or automatic incompatibility pruning: restrained selection is a
model instruction; code validates values and applies a deterministic pass order.
Long-run performance and guaranteed target FPS have not been established.

The original design below is retained to document intent and follow-ups.

## Goal

One prompt selects a clip and a suitable effect chain. Relative prompts compare
against the currently displayed clip AND its applied effects. Effects can change
without restarting or replacing the clip. Explicit `next` still requests another
clip and preserves the existing recent-clip avoidance.

Keep Python for Jev, media preparation and session state. Add a small TypeScript
rendering module, bundled locally with esbuild, using `@vfx-js/core` and
`@vfx-js/effects`. No framework migration. Pin verified published package versions
and commit the lockfile; upstream main and published docs can differ.

## Effects

| Product name | Implementation | Main controls |
| --- | --- | --- |
| RGB | RgbShiftEffect; custom directional variant if needed | amount, speed, direction |
| Twitch | Custom intermittent UV translation/zoom/rotation | amplitude, event rate, duration, seed |
| Hue | HueShiftEffect adapter | angle, cycle speed |
| Flip | Custom UV reflection | horizontal, vertical |
| Mirror | Custom UV folding around an axis | axis, center, mix |
| Trails | Custom persistent render target accumulation | feedback |
| Edge | ColoredEdgesEffect adapter | threshold, thickness, colors, mix |
| Colorize | Custom luminance-preserving tint / Duotone adapter | target color, saturation, mix |
| Halftone | HalftoneEffect | ink preset, dot size, angle, mix |
| Colorama | Custom folded luminance palette | palette (rainbow, red-blue, yellow-pink, cyan-purple, white-black), frequency, speed |
| Hatched | Custom luminance-thresholded crosshatching | line spacing, width, angle, layers, mix |
| Invert | Custom RGB inversion | channels, mix |
| LoRez | PixelateEffect plus color quantization | pixel size, color levels, mix |
| Shift Glitch | Custom time-varying band displacement | band size, displacement, event rate, seed |

Existing RgbShiftEffect is animated horizontal displacement; it does not provide
all Resolume Shift RGB modes. SliceShiftEffect shifts strips along their division
axis with static per-strip randomness; it is a reference, not a drop-in temporal
Shift Glitch. GradientMapEffect already supports 2–8 colors, offset, frequency,
repeat modes and speed. Colorama starts with cyclic luminance-to-palette mapping;
arbitrary channel-driven mappings can be added later.

Saturation, Bloom and Vignette are useful low-cost follow-ups. The 14 requested
effects are the initial feature scope; acceptance is visual intent, not exact
pixel equivalence with Resolume.

## Renderer

- Attach a persistent VFX instance to the current video. Keep native video as
  decoder and playback clock. Render inside the preview/fullscreen subtree;
  verify the installed version's canvas placement rather than assume a page
  overlay will enter fullscreen with the stage.
- Initial spike: passthrough, object-fit/letterboxing, resize, fullscreen, controls,
  CSP compatibility and source replacement. Use explicit playback controls if
  the effect canvas obscures native video controls.
- Chain order starts as geometry → surface treatment → RGB/glitch → color →
  temporal → finish. Enforce final color constraints after color-generating
  effects, so monochrome does not become colored by RGB separation.
- Adapter per effect exposes validated parameters, mix, update and reset. A
  dry/wet wrapper supplies a render target and final blend where the effect has
  no native mix. Preserve premultiplied alpha and source UV mapping.
- Change parameters in-place. Reuse unchanged effect instances when replacing
  the chain with updateEffects. Fade ordinary changes over about 300–800 ms;
  keep deliberate Twitch events crisp. Crossfade topology changes through a
  temporary output mix if parameter interpolation cannot express the change.
- Animate locally every frame; Jev runs only on operator/auto-next decisions.
  Keep a continuous local phase so changing speed does not jump in time.
- Trails uses a persistent ping-pong render target. Read history, composite
  current input, write new history, then output. Retention derives from elapsed
  per-frame feedback (`clamp(feedback, 0, 1) * 0.5`).
- Reset temporal history on clip change, seek, resolution change and context
  restore. Preserve it on ordinary parameter changes; allow continuous trails
  across normal loop boundaries. Resume after a long suspension without a dt spike.
- Allocate GPU resources on initialization/resize, not per frame; dispose when
  removed. Test 720p/1080p with several effects, cap render resolution explicitly,
  and measure frame times before promising a target FPS.
- Rendering failure exposes the raw video and reports the actually applied
  effect state. A failed GPU chain must not be recorded as successfully applied.

## Jev decisions and state

1. Existing selection request chooses clip/current-clip. Add a short description
   of achievable transformations. Do not reject a good motif solely because its
   color can be changed as requested. Subject matter and intrinsic rapid flashing
   still require suitable source footage.
2. After the clip choice, a smaller request sees only that clip, the prompt,
   previous clip/effect state, recent decisions and the effect catalog. Video
   preparation can run concurrently with this request.
3. Each effect has a Choice question selecting `off` or a small named parameter
   preset. Each choice includes a complete correlated setting, e.g. sparse mild
   Twitch versus frequent strong Twitch. Do not interpret choice confidence as
   intensity. All questions include their own meaning and share the same state;
   they cannot depend on one another's answers.
4. A code-side compiler validates ids/ranges, resolves incompatible settings,
   orders passes and budgets simultaneous effects (initial soft target: 0–3).
   Explicit requests take precedence over optional mood treatments. Use known
   preset constraints and validate the whole chain; do not silently drop an
   explicit effect just to satisfy the soft budget.
5. If effect selection fails, keep the current presentation and allow retry.
   Clip and effect decisions remain pending until their output is applied.

Catalog entries contain visual description, applicable source features,
changed/preserved properties, incompatibilities, parameters and cost tier.
Start with restrained/moderate/strong preset variants plus static/animated variants
where meaningful. Named palettes support red, blue, monochrome, rainbow, etc.
Preset values are application data shared by Python and the frontend, not GLSL
or arbitrary numbers generated by Jev.

Persist `current_presentation = {clip_id, effect_chain, revision}` and the actually
applied chain in presentation history. Keep clip-play history separate so effect
adjustments do not count as new clips or pollute the recent-three rule. Track
transformation intent separately from source metadata; it is not measured output.

Modify the current `keep` early return: the same clip can produce `effects_updated`.
Keep current clip eligible for ordinary selection when an effect-only adjustment
fits; never allow that for explicit `next`. Add a `clip locked` UI mode for reliably
editing effects only, which can skip the large clip-selection request entirely.

Reuse generation/ticket cancellation and add an applied acknowledgement for
effect updates; an old result must not overwrite newer output. Refresh must restore
both clip and effects. Do not mutate library attributes when recoloring a clip.

## UI and files

- Applied effects displayed as small named controls with strength, bypass and
  an all-effects bypass for A/B comparison. Optional clip lock. Manual changes
  must update server presentation state before the next relative prompt.
- `effects/catalog.json`: semantic preset descriptions and validated parameters.
- `effects/registry.ts`: adapters, ordering, common mix and parameter updates.
- `effects/custom/*.ts`: missing shaders and Trails lifecycle.
- `player-renderer.ts`: VFX instance, video integration, transitions and recovery.
- `effect_selection.py`: Jev questions, validation and presentation compilation.
- Update `player_server.py`, `player.js`, `player.html` and `player.css` for
  presentation state, acknowledgements and controls.
- Add package/build files and a tightly scoped static bundle route; preserve
  server-side API credentials and same-origin media. Verify CSP style handling
  against VFX's actual initialization before changing policy.

## Implementation sequence and acceptance

1. Renderer spike + manual RGB/Hue/Flip/Mirror/Halftone on actual local clips.
   Verify unchanged playback, aspect ratio and fullscreen.
2. All 14 effects manually adjustable, including Trails lifecycle. Check real
   footage plus color bars, grayscale ramp and moving shapes for predictable
   color, flip and temporal behavior.
3. Shared catalog + staged Jev selection + applied presentation state. Test
   cancellation, same-clip changes, reload, failure and recent-clip behavior.
4. Tune restrained presets and transitions using representative prompts:
   `モノトーン ミニマル`, `ゆったりしたアンビエント`, `メッチャ激しく`,
   `青く、左右対称`, `印刷物っぽく`, `もっと残像を長く`, `加工を外して`.
   Verify explicit requests visually, not only via returned preset IDs.

Two API calls are the normal automatic path, plus existing clip retry behavior.
Measure effect-stage tokens/latency separately; do not resend all 111 clips and
their attributes for the second request. Run meaningful existing Python tests,
new presentation-state tests, TypeScript build checks and browser visual/performance
checks. Do not claim semantic correctness from schema validation alone.

## Sources inspected

- https://github.com/fand/vfx-js/tree/main/packages/effects/src
- https://github.com/fand/vfx-js/blob/main/packages/effects/src/gradient-map.ts
- https://github.com/fand/vfx-js/blob/main/packages/effects/src/tritone.ts
- https://github.com/fand/vfx-js/blob/main/packages/effects/src/slice-shift.ts
- https://amagi.dev/vfx-js/docs/types/_vfx-js_core.EffectContext.html
- https://www.npmjs.com/package/@vfx-js/core
- https://docs.typesafe.ai/primitives/choice
