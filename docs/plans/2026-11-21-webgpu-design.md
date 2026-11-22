# 12daysofxmas on WebGPU: design

Date: 2026-11-21
Status: approved
Size: feature
Linear: H3N-59 (sub-issues H3N-93 to H3N-99)
Project: 12daysofxmas
Builds on: 2026-11-21-webgpu-story-design.md (the story, feature 2); h3nr7-coding-tools docs/plans/2026-11-21-references-design.md (H3N-82, the references this pulls in); 2026-11-21-debug-mode-design.md (H3N-78)

## Intent

Move every 3D scene in 12daysofxmas from the WebGL renderer to three's
`WebGPURenderer`, so the days still to build can use compute shaders and
node-based effects. The boids run on the flock reference from
h3nr7-coding-tools, pulled in with the `h3nr7-components` skill, and the
canvas on the WebGPU canvas reference. Everything that was GLSL is rebuilt
on three's node materials and node post-processing. Nothing a visitor sees
is meant to match the old scenes; it has to render, function and throw no
errors.

## Goals

- Every mounted scene (`/`, `/first`, `/fifth`, `/eighth`, `/sandbox`)
  renders on WebGPU in Chrome with each element present and moving: boids
  with wings flapping, bloom, grain, tilt-shift, stars, trails, the
  diamond, the text, the Christmas scenes with their physics.
- No GLSL, `ShaderMaterial`, `onBeforeCompile`, `GPUComputationRenderer`,
  pmndrs `postprocessing` or `vite-plugin-glsl` remains.
- Without WebGPU the canvas is not mounted and the home page says so in one
  line. The HTML works on every route.
- The smoke test runs the scene routes on headless WebGPU where the browser
  gives an adapter, and skips them with the reason where it does not.
- Type-check, lint, build, units and CI stay green.

## Non-goals

- Any WebGL fallback.
- Matching the old scenes in look, timing or tuning.
- New scenes, or mounting Second, Third and Fourth.
- Adopting the h3nr7 ui.
- Changing the h3nr7 monorepo or the references in coding-tools, other
  than a fix fed back by hand if a flaw is found.
- Firefox and Safari in the smoke test.
- Making Satellite visible. It is defined and mounted nowhere today; it is
  ported so the project carries no GLSL, and stays unmounted.

## Anti-goals

Failed even if green if: a WebGL path is kept alive; an effect is written
by hand when three provides it; a test pins a 3D scene to what WebGL did;
the smoke test is silenced rather than run or skipped with its reason; the
scene routes stay skipped at the end.

## Constraints

From the story: WebGPU only; one copy of three through the Vite alias;
library first; the h3nr7 monorepo read only; never like for like; one
commit per task with every check that exists green; pnpm.

Of this feature:

- The two references come in through the skill, read from the local
  coding-tools checkout (`skills/h3nr7-components/SKILL.md` on branch
  `feature/references`), target path `src/three`. The copies are owned
  here and may be edited; a change that is a flaw in the reference is also
  made in coding-tools.
- No file in `src/` imports bare `three`, except the alias shim itself.
  Project code imports `three/webgpu` and `three/tsl`; three's addons
  (`three/examples/jsm/...`, where the display nodes and the fat lines
  live) are allowed and reach three through the alias, as every dependency
  does.
- The alias shim is the canvas README's, stand-ins included.
- Work is on branch `feature/webgpu` in the `12daysofxmas-webgpu` worktree,
  off `origin/develop`.
- While the scenes are being moved, the scene routes in the smoke test are
  skipped with the reason "being moved to WebGPU, H3N-59" from task 1 and
  put back in the last task. Type-check, lint, build and units stay green
  at every task.

## Where the work stands

See the story design's table. In short: `ThreeView.tsx` mounts R3F's
`Canvas`; `src/three/components/Boids/` is `GPUComputationRenderer` with
four GLSL files, `BoidsGltf.tsx` patching a `MeshStandardMaterial` with
`onBeforeCompile` to draw 256 parrots from `Parrot.glb` with the wing morph
baked into a `DataTexture`, and `BoidsSimple.tsx` on a `ShaderMaterial`
(Sixth only, unmounted); `EffectControls.tsx` is pmndrs `EffectComposer`
with `Bloom` (threshold 1, intensity 15, mipmap blur, 9 levels),
`ToneMapping` ACES, optional `Noise` (darken, premultiplied) and a custom
`Tiltshift` effect (blur 0.035, taper 0.1, start 0.01, end 1.0, 5
samples), switched by `fiberStore.effect.noise` and `.tiltshift`; drei's
`Stars` in `ThreeView.tsx` (radius 200, depth 10, count 1500, factor 4,
saturation 10, fade, speed 1); drei's `Trail` in `OrbitalTrails.tsx`
(width 0.05, grey, length 5, decay 2) around 20 react-spring particles;
drei's `CubeCamera` in `Diamond.tsx` and `BlockText.tsx` feeding an RGBE
texture to `meshBasicMaterial`'s `envMap`; `Satellite.tsx`, a
`ShaderMaterial` on `<points>` with two tiny GLSL files, mounted nowhere;
`vite.config.ts` with `vite-plugin-glsl` and `vite-plugin-restart`
watching `*.glsl`.

The smoke test (`e2e/smoke.spec.ts`) waits for `canvas[data-engine]`,
asks it for a WebGL context and fails on any page or console error;
`e2e/browser.ts` holds the SwiftShader flags; `playwright.config.ts` runs
against the production build; CI runs it on `ubuntu-latest` with
Playwright's chromium. The capture script already uses D3D11 on Windows.

What the proof in H3N-88 established: headless WebGPU works on this
machine with Playwright's full chromium (`channel: 'chromium'`, not the
headless shell) and `--enable-unsafe-webgpu --use-angle=d3d11
--ignore-gpu-blocklist`; the Vulkan flags give no adapter here. With drei
installed the dev server runs on the plain alias but the production build
needs the shim's stand-ins. The `WebGPURenderer` sets `data-engine` on its
canvas like the WebGL one.

## Approaches

Settled by the story (approach A, reference first). Within this feature
one choice was open: how to render sized points (stars, satellite) on
WebGPU.

- **Sprites on an instanced plane with `SpriteNodeMaterial`.** Chosen.
  Point size is not a WebGPU concept, and three's own WebGPU examples draw
  particles this way; `scaleNode`, `positionNode` and `opacityNode` give
  twinkle, size and the radial fade directly.
- **`PointsNodeMaterial` with `sizeNode`.** Simpler geometry, but sized
  points on WebGPU depend on three turning them into quads internally,
  which varies by version; not worth the gamble when sprites are a known
  path.

And one for the trail:

- **`Line2NodeMaterial` on a `LineGeometry` of the last N positions.**
  Chosen. Fat lines in world or screen units, library-provided, with
  vertex colours for the fade.
- **A ribbon mesh built by hand.** More code for the same picture.

## The design

### How it fits together

```
App.tsx            useWebGPUSupport() ─ no ──▶ ZeroUI shows the note; ThreeView not mounted
                         │ yes
ThreeView.tsx      <WebGPUCanvas>  (src/three/webgpu-canvas, from the reference)
                      <color background> <fogExp2>
                      scenes: Zero, First, Fifth, Eighth, Sandbox (unchanged files, new children)
                      <Ground> <Stars (new)> <Lightings> <CamControls> <PostFX (new)>
vite.config.ts     alias /^three$/ → src/three-webgpu.ts (shim + stand-ins); no glsl plugin
src/three/flock/   the flock reference (Boids, Butterfly, Flock, helpers)
src/three/components/Boids/BoidsParrot.tsx   the parrot on the reference's buffers
```

Render loop: R3F stops rendering itself once `PostFX` subscribes a frame
callback at priority 1 and calls `postProcessing.render()`; everything
else keeps its `useFrame` as it is.

### The canvas

- The skill, followed from `SKILL.md`, copies `webgpu-canvas` to
  `src/three/webgpu-canvas/`. Its dependency step adds nothing: three
  0.187, fiber 9.8 and `@types/three` are present.
- `src/three-webgpu.ts` is the README's shim. `vite.config.ts` gets
  `resolve.alias: [{ find: /^three$/, replacement: '/src/three-webgpu.ts' }]`,
  loses `vite-plugin-glsl` and the `*.glsl` watch. Vitest shares the
  config, so the alias applies to unit tests too; `pnpm test` after this
  change is the check that `three/webgpu` loads under Node. If it does
  not, `test.alias` points `three` at the classic build for tests only,
  and the design records it.
- `ThreeView.tsx` renders `<WebGPUCanvas className="canvas"
  eventSource={eventSource} style={{ width, height }} onCreated={({ gl })
  => { gl.toneMapping = ACESFilmicToneMapping }}>` in place of `<Canvas>`.
  Children as today, with `<Stars>` now local and `<PostFX>` in place of
  `<EffectControls>`.
- `src/hooks/webgpu.ts`: `supportsWebGPU(nav: { gpu?: { requestAdapter():
  Promise<unknown> } }): Promise<boolean>` (true only when `gpu` exists and
  `requestAdapter()` resolves non-null; false on throw) and
  `useWebGPUSupport(): 'checking' | 'yes' | 'no'`. `App.tsx` mounts
  `ThreeView` only on `'yes'`. `ZeroUI.tsx` renders, on `'no'`, under the
  button: `<h6 className="zero__webgpu">These scenes need a browser with
  WebGPU: Chrome, Edge, Safari 26 or Firefox.</h6>`, in the existing `h6`
  style of the debug line. `'checking'` shows nothing extra.

### The boids

- The skill copies `flock` to `src/three/flock/`. Nothing is installed.
- `src/three/components/Boids/` keeps `index.ts`, `helpers/math.ts` and
  gains `BoidsParrot.tsx`; `Boids.tsx`, `BoidsGltf.tsx`, `BoidsSimple.tsx`,
  `Boids.interface.ts`, `shaders/`, `geometry/`, `helpers/initialisers.ts`
  and its test go. `index.ts` re-exports `Boids` and `useBoids` from
  `../../flock` and `BoidsParrot`.
- `BoidsParrot` props: `url` (the GLTF), `size` (default 0.05). It loads
  the GLTF with `useGLTF`, bakes the wing animation into the same
  `DataTexture` as `BoidsGltf` did (the texture-building loop moves over
  as is, into a pure `bakeAnimation(gltf)` returning `{ texture, tWidth,
  tHeight, duration }`), and builds an `InstancedBufferGeometry` from the
  bird's own `position`, `uv` and index with `instanceCount = count` from
  `useBoids()`. One bird's vertices, instanced, in place of 256 copies.
- Its material is a `MeshStandardNodeMaterial` (`map` from the GLTF,
  `flatShading`, roughness 1, metalness 0, `fog: false`) whose
  `positionNode` is built in TSL: `pos = positionBuffer.element(instanceIndex)`,
  `vel = velocityBuffer.element(instanceIndex)`; the animation frame
  `aniPos = texture(animation, vec2(vertexIndex / tWidth, (uTime * speed +
  hash(instanceIndex)) mod (duration / tHeight))).xyz`; `local = (positionLocal
  + aniPos) * (size + hash(instanceIndex.add(1)) * size * 0.2)`; the flight
  basis from `vel` as `Butterfly.tsx` builds it (forward, right, up with
  fallbacks); `positionNode = basis(local) + pos`. `uTime` is a uniform
  written each frame. `frustumCulled` false.
- Eighth, Sandbox and Sixth: `<group position={center} scale={BOID_SCALE}>
  <Boids count={256} preyRadius={…}><BoidsParrot url="/Parrot.glb" /></Boids>
  </group>` with `BOID_SCALE` chosen so the flock spans a few world units
  around the scene centre (the reference's birds start within ±250 boid
  units; 0.01 gives ±2.5), and the reference's default rules. `predator`
  and `freedomFactor` are gone; the reference's default attractor stands
  in. Tuned by eye in Eighth, then copied to the other two.

### The effects

`src/three/components/EffectControls/PostFX.tsx` replaces
`EffectControls.tsx` and `components/Tiltshift.tsx`:

- Built once per renderer: `const post = new RenderPipeline(renderer)`
  (`PostProcessing` is a deprecated shim over it since r183 and warns on
  construction); `const scenePass = pass(scene, camera)`; `const colour =
  scenePass.getTextureNode('output')`. `bloom`, `film` and `gaussianBlur`
  come from `three/examples/jsm/tsl/display/*.js`, not `three/tsl`.
- The chain, rebuilt (and `post.needsUpdate = true`) whenever the store's
  `noise` or `tiltshift` flips: `let out = colour.add(bloom(colour,
  strength, radius, threshold))` with starting values strength 1.5, radius
  0.4, threshold 1, tuned by eye; if `tiltshift`, `out = tiltShift(out)`;
  if `noise`, `out = film(out, 0.15)`; `post.outputNode = out`. Tone
  mapping and colour space come from `outputColorTransform` (default
  true), which applies the renderer's ACES.
- `tiltShift(node)`: a TSL function in `tiltShift.ts`. `blurred =
  gaussianBlur(node, vec2(1, 1), sigma)`; `d` = distance of `screenUV`
  from the line through `start` (0.01, 0.01) and `end` (1, 1) in uv space;
  `mask = smoothstep(0, taper, d)`; result `mix(node, blurred, mask)`.
  `sigma` 3, `taper` 0.1 as starting values. The distance-to-line maths is
  a pure function in `tiltShiftMath.ts` with a unit test, used to compute
  the normal and offset the shader takes as uniforms.
- `PostFX` renders with `useFrame(() => post.render(), 1)`.
- `<fogExp2 attach="fog" …>` stays where it is.

### The helpers

- `Stars.tsx` (new, `src/three/components/Stars/`): props as drei's that
  the scene uses (`radius` 200, `depth` 10, `count` 1500, `factor` 4,
  `saturation`, `fade`, `speed`). An `instancedBufferGeometry` of one
  small plane with per-instance `position` (a point on a shell between
  `radius` and `radius + depth`, drei's spherical scatter), `size`
  (random 0.5 to 1.5 times `factor`) and `seed`. A `SpriteNodeMaterial`
  with `positionNode` from the instance position, `scaleNode = size *
  (0.75 + 0.25 * sin(uTime * speed + seed))`, `colorNode` white with
  `saturation` as a slight blue tint, `opacityNode` a radial fade from the
  sprite's uv when `fade` is set, additive blending, `depthWrite` false,
  `frustumCulled` false.
- `Trail.tsx` (new, beside `OrbitalTrails.tsx`): props `width` (world
  units), `colour`, `length` (points kept), `children` the particle. Each
  frame it reads the child group's world position into a ring buffer
  (`ring.ts`, pure: `push`, `toArray` oldest first, unit tested), writes
  the ring into a `LineGeometry` with `setPositions` and `setColors` (the
  colour fading toward the scene background along the ring), drawn by a
  `Line2` with a `Line2NodeMaterial` (`worldUnits` true, `linewidth` =
  `width`, `vertexColors`). `OrbitalTrails.tsx` swaps the import and the
  prop names; the particles are unchanged.
- `Diamond.tsx`, `BlockText.tsx` and the orbit particles in
  `OrbitalTrails.tsx`: the `CubeCamera` wrapper goes. The RGBE texture gets
  `mapping = EquirectangularReflectionMapping` once (`useEnvTexture()` in
  `src/three/utils/assets.ts`, which loads it and sets the mapping), and
  `meshBasicMaterial envMap={texture}` stays in all three places. If a
  basic material ignores the environment on WebGPU, the material becomes
  a `MeshStandardNodeMaterial` with `envNode = pmremTexture(texture)`,
  roughness 0, metalness 1, and the design records it.
- `Satellite.tsx`: the two GLSL files go. WebGPU draws point primitives
  at 1px whatever `sizeNode` says (three's own doc on
  `PointsNodeMaterial`), so it becomes the same instanced sprite as the
  stars: a `SpriteNodeMaterial` with `scaleNode` from `uSize` and
  `colorNode = vec4(uv(), 1, 1)`. Still exported, still unmounted; it
  exists so no GLSL remains.

### Tests

- Units (Vitest): `supportsWebGPU` (no `gpu`: false; adapter null: false;
  adapter object: true; throws: false); `ring.ts`; `tiltShiftMath.ts`;
  and the flock's own `forces.spec.ts` and `repeller.spec.ts` (31 tests),
  which run here once `vitest.config.ts` includes `src/**/*.spec.ts`.
  `vitest.config.ts` is its own file and does not read `vite.config.ts`,
  so the alias never reaches unit tests; under Node the specs' bare
  `three` is the classic build, which is what they want.
- Smoke (`e2e/smoke.spec.ts`): `waitUntilReady` asks the canvas for a
  `webgpu` context instead of WebGL. A `beforeAll` probes
  `navigator.gpu.requestAdapter()` in a page; without an adapter the scene
  routes are skipped with "no WebGPU adapter in this browser; see
  H3N-59". `e2e/browser.ts` exports the WebGPU flags per platform (D3D11
  on Windows, `--enable-unsafe-webgpu --enable-features=Vulkan
  --use-angle=vulkan` elsewhere, plus `--ignore-gpu-blocklist`) and
  `playwright.config.ts` sets `channel: 'chromium'`. `CLOCKS` goes back to
  `SCENE_ROUTES` in the last task. A note test: with `navigator.gpu`
  removed by an init script, `/` shows the `h6` and no canvas.
- The capture script keeps working: its D3D11 flags already enable WebGPU
  with the unsafe flag added.
- Sign-off by eye, one line per element, as the story lists. Nothing
  compared like for like.

### Not doing

See the non-goals.

## Decisions

From the story: WebGPU only; one copy of three via the alias; the parrot
stays; all four effects, library first; Stars, Trail, CubeCamera and
Satellite hand-built; smoke tests try headless WebGPU else skip with the
reason; never like for like.

My calls, open to overruling:

- `BoidsParrot` instances one bird's geometry rather than copying it 256
  times, as the reference's `Butterfly` does. The flight basis is
  `Butterfly`'s, not the old two-matrix rotation; movement need not match.
- Points are sprites on an instanced plane (`SpriteNodeMaterial`), for
  the stars and the satellite alike, since WebGPU point primitives are 1px.
- The post-processing frame is `RenderPipeline`, found by the builder
  check: `PostProcessing` is a deprecated shim over it that warns.
- The flock's specs run in this project's unit tests; the vitest include
  is widened to `src/**/*.spec.ts` in the boids task.
- `PostFX` takes over the render loop at priority 1, which is how R3F
  hands rendering to post-processing.
- The noise is three's `film` at low intensity rather than a darken blend;
  grain is grain.
- The trail fades by vertex colour toward the background colour rather
  than by width, since fat lines have one width.
- The environment map is used directly as an equirectangular map; the
  `CubeCamera` added a render pass for a reflection nobody could see at
  that size.
- Scene routes are skipped in the smoke test from task 1 to the last task,
  with the reason written, so every task stays green.
- The smoke test self-skips without an adapter, so CI on Linux is not a
  blocker: it either runs the scenes or says why not. Whether GitHub
  Actions' Chromium gives an adapter is learned when the branch is pushed.
- `gl-matrix` and `typed-glsl` leave with the old boids if nothing else
  imports them; `vite-plugin-restart` stays for `public/`.
- Sixth gets the parrot and stays unmounted.

## How the owner knows it works

The five scene routes render on WebGPU in Chrome with each element present
and moving and no console errors; `/` with WebGPU off shows the one-line
note and no canvas; `grep` finds no `glsl`, `ShaderMaterial`,
`onBeforeCompile`, `GPUComputationRenderer`, `postprocessing` or
`from 'three'` (outside the shim) in `src/`; `pnpm typecheck`, `pnpm lint`,
`pnpm build`, `pnpm test` pass; `pnpm test:e2e` runs the scene routes on
WebGPU locally; CI is green with the scenes run or skipped with the reason.

## Left to the builder

- Every tuning number: bloom, tilt-shift sigma and taper, film intensity,
  star sizes and twinkle, trail length, `BOID_SCALE`, parrot wing speed.
- Nothing about Vitest: `three/webgpu` loads under Node (checked), and the
  unit tests never see the alias.
- The exact TSL for the animation texture lookup.
- Whether `OrbitControls`-style helpers in CamControls need any change
  (none expected: camera-controls is renderer-agnostic).
