# Implementation Plan: 12daysofxmas on WebGPU

Design: [2026-11-21-webgpu-design.md](./2026-11-21-webgpu-design.md)
Linear: H3N-59

## Overview

Move every 3D scene to three's `WebGPURenderer`: the canvas on the WebGPU
canvas reference, the boids on the flock reference with a TSL parrot, the
effects on three's node post-processing, and Stars, Trail, the environment
map and Satellite rebuilt on node materials. Finish with the smoke test on
headless WebGPU and the GLSL tooling removed. The bar for every scene is:
renders, functions, no errors. Nothing is matched like for like.

## Global constraints

- Branch `feature/webgpu` in the worktree
  `c:\Users\h3nr7\Documents\projects\12daysofxmas-webgpu`, off
  `origin/develop`. One commit per task.
- No file in `src/` imports bare `three`, except `src/three-webgpu.ts`.
  Project code imports `three/webgpu` and `three/tsl`; three's addons
  under `three/examples/jsm/` are allowed and reach three through the
  alias, as every dependency does.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` pass at the end
  of every task. `pnpm test:e2e` passes at the end of every task, with the
  scene routes skipped with the reason "being moved to WebGPU, H3N-59"
  from task 1 until task 6 puts them back.
- Between task 1 and the end of tasks 2 to 5, the scenes do not work in a
  browser; that is expected and the smoke test's skip reason says so.
- Tasks 2, 3, 4 and 5 touch disjoint files and may be built in parallel,
  each on a branch off task 1's commit, merged in order 2, 3, 4, 5 before
  task 6.
- Tuning numbers (bloom, blur, grain, star sizes, trail length,
  `BOID_SCALE`, wing speed) are the builder's, by eye. No test pins them.
- Dependencies are added or removed only where a task says so.
- The references in coding-tools are read from the local checkout at
  `c:\Users\h3nr7\Documents\projects\h3nr7\h3nr7-coding-tools` on branch
  `feature/references`. A flaw found in a copy is fixed there too, by hand.

## Tasks

### 1. The canvas on WebGPU

**Goal:** The app renders through `WebGPURenderer` with one copy of three,
mounts no canvas without WebGPU and says so on the home page, and every
check is green with the scene routes skipped.

**Files affected:**
- `src/three/webgpu-canvas/WebGPUCanvas.tsx` (new, copied by the skill)
- `src/three-webgpu.ts` (new, the canvas README's shim with stand-ins)
- `vite.config.ts` (alias)
- `src/three/ThreeView.tsx`
- `src/hooks/webgpu.ts` (new), `src/hooks/webgpu.test.ts` (new)
- `src/App.tsx`, `src/routes/Zero/ZeroUI.tsx`, `src/routes/Zero/Zero.scss`
- `e2e/smoke.spec.ts` (skip the scene routes with the reason)

**Interfaces:**
- Produces: `supportsWebGPU(nav): Promise<boolean>`;
  `useWebGPUSupport(): 'checking' | 'yes' | 'no'`; the alias and shim every
  later task relies on; `WebGPUCanvas` with `onCreated` setting
  `gl.toneMapping = ACESFilmicToneMapping`.

**What it does:**
- Follow `skills/h3nr7-components/SKILL.md` for `webgpu-canvas`, target
  `src/three`. Record that the dependency step added nothing.
- `src/three-webgpu.ts` is the README's shim verbatim (re-export of
  `three/webgpu`, `WebGLCubeRenderTarget` alias, six stand-ins).
  `vite.config.ts`: `resolve.alias: [{ find: /^three$/, replacement:
  '/src/three-webgpu.ts' }]`. Leave `vite-plugin-glsl` for task 7.
- `vitest.config.ts` is its own file and never sees the alias; nothing
  to do there in this task.
- `ThreeView.tsx`: `<WebGPUCanvas className="canvas" eventSource
  style onCreated>` in place of `<Canvas>`; remove `<EffectControls />` and
  move `<fogExp2 attach="fog" args={[UNIVERSE_BG_COLOR, 0.15]} />` into
  `ThreeView`; delete `EffectControls.tsx` and `components/Tiltshift.tsx`
  (task 3 adds `PostFX`). Every `from 'three'` in `src/` becomes
  `from 'three/webgpu'` (a grep-driven sweep; `three/src/math/MathUtils.js`
  in Diamond becomes `MathUtils` from `three/webgpu`).
- `src/hooks/webgpu.ts` as the design states. `App.tsx` mounts
  `<ThreeView>` only when support is `'yes'`. `ZeroUI.tsx` renders the
  `h6.zero__webgpu` note on `'no'`, styled like the debug `h6`.
- `e2e/smoke.spec.ts`: `CLOCKS[*].runs` becomes `[]` with the skip reason
  "being moved to WebGPU, H3N-59"; `waitUntilReady` asks for a `webgpu`
  context (`el.getContext('webgpu')`) and reports `hasContext` from it.

**Acceptance criteria:**
- [ ] `grep -rn "from 'three'" src` (and the double-quoted form) matches
      only `src/three-webgpu.ts`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`,
      `pnpm test:e2e` pass; the e2e report lists the scene routes as
      skipped with "being moved to WebGPU, H3N-59".
- [ ] `webgpu.test.ts`: no `gpu` → false; `requestAdapter` resolves null →
      false; resolves an object → true; throws → false.
- [ ] In Chrome with WebGPU, `/` shows a canvas whose context is `webgpu`
      (`document.querySelector('canvas').getContext('webgpu')` non-null)
      and no `h6.zero__webgpu`.
- [ ] In Chrome with `navigator.gpu` removed (an init script or
      `--disable-features=WebGPU`), `/` shows no canvas and the `h6`
      reading "These scenes need a browser with WebGPU: Chrome, Edge,
      Safari 26 or Firefox.", and the title and button still render.

**Risk:** none known: `three/webgpu` loads under Node and the unit tests
do not use the alias.

### 2. The boids on the flock reference

**Goal:** Eighth, Sandbox and Sixth draw parrots driven by the reference
flock's compute passes, with their wings moving, and the old boids are
gone.

**Files affected:**
- `src/three/flock/*` (new, copied by the skill)
- `src/three/components/Boids/BoidsParrot.tsx` (new)
- `src/three/components/Boids/bakeAnimation.ts` (new)
- `src/three/components/Boids/index.ts`
- `src/three/components/Boids/Boids.tsx`, `BoidsGltf.tsx`,
  `BoidsSimple.tsx`, `Boids.interface.ts`, `shaders/*`, `geometry/*`,
  `helpers/initialisers.ts`, `helpers/initialisers.test.ts` (deleted)
- `src/three/routes/Eighth/Eighth.tsx`, `Sandbox/Sandbox.tsx`,
  `Sixth/Sixth.tsx`

**Interfaces:**
- Consumes: `Boids`, `useBoids` from `src/three/flock` (count,
  `positionBuffer`, `velocityBuffer`, `phaseBuffer`), the alias from task 1.
- Produces: `BoidsParrot({ url, size = 0.05 })`; `bakeAnimation(gltf):
  { texture: DataTexture, tWidth, tHeight, duration }`; `index.ts`
  exporting `Boids`, `useBoids`, `BoidsParrot`, `BOID_SCALE`.

**What it does:**
- Follow the skill for `flock`, target `src/three`. Nothing installed.
- `bakeAnimation` is `BoidsGltf`'s texture loop moved out, unchanged in
  what it computes, importing from `three/webgpu`.
- `BoidsParrot` as the design states: instanced geometry from the bird's
  `position`, `uv`, index with `instanceCount = count`;
  `MeshStandardNodeMaterial` with the GLTF's map, `flatShading`,
  roughness 1, metalness 0, `fog: false`; `positionNode` from the flock
  buffers, the animation texture sampled at
  `vec2(vertexIndex / tWidth, (uTime * speed + hash(instanceIndex)) mod
  (duration / tHeight))`, the flight basis as `Butterfly.tsx`; `uTime`
  written in `useFrame`; `frustumCulled` false.
- The three scenes: `<group position={center} scale={BOID_SCALE}><Boids
  count={256} preyRadius={…}><BoidsParrot url="/Parrot.glb" /></Boids></group>`,
  `BOID_SCALE` starting at 0.01, tuned by eye in Eighth.
- `vitest.config.ts`: `include: ['src/**/*.test.ts', 'src/**/*.spec.ts']`,
  so the flock's two spec files run here.
- `gl-matrix` and `typed-glsl` imports go with `BoidsGltf`; the packages
  are removed in task 7.

**Acceptance criteria:**
- [ ] `src/three/components/Boids/` contains only `index.ts`,
      `BoidsParrot.tsx`, `bakeAnimation.ts` and `helpers/math.ts`; no
      `.glsl` or `shaders/` under `src/three/components/Boids`.
- [ ] `grep -rn "GPUComputationRenderer\|onBeforeCompile\|typed-glsl\|gl-matrix" src`
      finds nothing.
- [ ] `/eighth` and `/sandbox` in Chrome with WebGPU: parrots visible,
      moving as a flock, wings moving, no console errors over 10 seconds.
- [ ] Sixth type-checks with the parrot (it stays unmounted).
- [ ] `pnpm test` runs `forces.spec.ts` and `repeller.spec.ts`: 31 tests
      passed, none skipped, alongside the existing tests.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` pass.

**Depends on:** task 1.

**Risk:** the animation texture lookup in TSL (`texture(...)` with a
computed uv on a float `DataTexture`). If filtering misbehaves, set the
texture's `minFilter`/`magFilter` to nearest and sample integer frames.

### 3. The effects on node post-processing

**Goal:** Bloom, ACES tone mapping, optional grain and optional tilt-shift
run through three's `PostProcessing`, switched by the store as before.

**Files affected:**
- `src/three/components/EffectControls/PostFX.tsx` (new)
- `src/three/components/EffectControls/tiltShift.ts` (new)
- `src/three/components/EffectControls/tiltShiftMath.ts` (new),
  `tiltShiftMath.test.ts` (new)
- `src/three/ThreeView.tsx` (mount `<PostFX />`)

**Interfaces:**
- Consumes: `useFiberStore().data.effect.noise` and `.tiltshift`;
  `useWebGPURenderer()` from the canvas copy; the alias.
- Produces: `PostFX` (no props); `tiltShift(node, { start, end, taper,
  sigma })`; `lineNormalAndOffset(start, end): { nx, ny, c }` such that the
  signed distance of uv `(x, y)` from the line is `nx*x + ny*y + c`.

**What it does:**
- As the design's "The effects": `new RenderPipeline(renderer)` (not the
  deprecated `PostProcessing`, which warns on construction), `pass(scene,
  camera)`, `colour = scenePass.getTextureNode('output')`, `bloom(colour,
  1.5, 0.4, 1)` added to the colour, then `tiltShift` if on, then
  `film(out, 0.15)` if on; `post.outputNode = out; post.needsUpdate =
  true` in an effect keyed on the two flags; `useFrame(() =>
  post.render(), 1)`. Dispose the `PostProcessing` on unmount.
- `tiltShift`: `gaussianBlur` from
  `three/examples/jsm/tsl/display/GaussianBlurNode.js`; `bloom` and `film`
  from `BloomNode.js` and `FilmNode.js` beside it (none are in
  `three/tsl`); mask `smoothstep(0, taper, abs(distance))` on `screenUV`,
  `mix`.

**Acceptance criteria:**
- [ ] `tiltShiftMath.test.ts`: for start (0,0), end (1,1), the point
      (1,0) has distance `1/√2` within 1e-6 and (0.5,0.5) distance 0; for
      a horizontal line the normal is vertical.
- [ ] `/` (tilt-shift on) in Chrome: the scene is sharp along the diagonal
      and blurred toward the corners; `/sandbox` (noise and tilt-shift
      off): neither; bright parts bloom on every route. Checked by eye.
- [ ] Toggling `setEffect({ noise: true })` from the console (or a debug
      route) adds visible grain within a frame; no console errors.
- [ ] `grep -rn "postprocessing\|EffectComposer\|wrapEffect\|PostProcessing" src`
      finds nothing, and the console shows no deprecation warning from
      three on load.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` pass.

**Depends on:** task 1.

**Risk:** `post.render()` and R3F's loop. If R3F still renders as well
(double render), the priority is wrong: it must be positive.

### 4. Stars and Satellite on sprites

**Goal:** The star field is back on every route, on a `SpriteNodeMaterial`,
and `Satellite` has no GLSL.

**Files affected:**
- `src/three/components/Stars/Stars.tsx` (new)
- `src/three/ThreeView.tsx` (import `Stars` locally)
- `src/three/components/Satellite/Satellite.tsx`
- `src/three/shaders/particles/orbit-vert.glsl`, `orbit-frag.glsl`
  (deleted), and `src/three/shaders/` if empty

**Interfaces:**
- Produces: `Stars({ radius = 200, depth = 10, count = 1500, factor = 4,
  saturation = 0, fade = false, speed = 1 })`; `Satellite({ visible,
  children })` unchanged in signature.

**What it does:** as the design's "The helpers": instanced plane,
per-instance position (drei's shell scatter), size and seed;
`SpriteNodeMaterial` with position, scale (twinkle), colour, radial
opacity when `fade`, additive, `depthWrite` false, `frustumCulled` false.
`Satellite` on the same instanced sprite as `Stars` (WebGPU draws point
primitives at 1px, so `PointsNodeMaterial.sizeNode` is no use on
`<points>`), `scaleNode` from `uSize`, `colorNode = vec4(uv(), 1, 1)`.

**Acceptance criteria:**
- [ ] `/` in Chrome: stars visible around the scene, twinkling; no
      console errors.
- [ ] `grep -rn "Stars" src/three/ThreeView.tsx` imports from
      `./components/Stars/Stars`, not drei; `grep -rn "\.glsl" src` finds
      nothing; `src/three/shaders/` does not exist.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` pass.

**Depends on:** task 1.

### 5. Trail and the environment map

**Goal:** The orbital trails draw on fat lines, and the diamond and the
text reflect the environment without a `CubeCamera`.

**Files affected:**
- `src/three/components/OrbitalTrails/Trail.tsx` (new)
- `src/three/components/OrbitalTrails/ring.ts` (new), `ring.test.ts` (new)
- `src/three/components/OrbitalTrails/OrbitalTrails.tsx` (the `Trail`
  swap, and the particles' `envMap` from `useEnvTexture`)
- `src/three/utils/assets.ts` (`useEnvTexture`)
- `src/three/components/Diamond/Diamond.tsx`
- `src/three/components/BlockText/BlockText.tsx`

**Interfaces:**
- Produces: `Trail({ width, colour, length, children })`;
  `createRing(n)`, `push(ring, x, y, z)`, `toArray(ring): Float32Array`
  oldest first, length `3 * filled`; `useEnvTexture(): Texture` with
  `mapping = EquirectangularReflectionMapping`.

**What it does:** as the design: `Line2` + `LineGeometry` +
`Line2NodeMaterial` (`worldUnits`, `linewidth = width`, `vertexColors`),
positions from the ring each frame, colours fading toward
`UNIVERSE_BG_COLOR` along the ring. `Diamond` and `BlockText` drop
`CubeCamera`, and they and the orbit particles pass the texture from
`useEnvTexture` as `envMap`; the
`MeshStandardNodeMaterial` + `pmremTexture` fallback if the basic
material shows no reflection.

**Acceptance criteria:**
- [ ] `ring.test.ts`: a ring of 3 after pushes a, b, c, d holds b, c, d
      oldest first; before it fills, `toArray` holds only what was pushed.
- [ ] `/` in Chrome: particles orbit with a visible trail behind each; the
      diamond rises and shows a reflection; `/first`: the text shows a
      reflection; no console errors.
- [ ] `grep -rn "CubeCamera\|from '@react-three/drei'" src` shows drei
      used only for `useGLTF`, `Text3D`, `FontData`, `CameraControls`,
      `Helper` and `Stats`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` pass.

**Depends on:** task 1.

**Risk:** `envMap` on `MeshBasicMaterial` under WebGPU; the fallback is
named.

### 6. Smoke test on headless WebGPU

**Goal:** The scene routes are back in the smoke test and run on WebGPU
where the browser gives an adapter, skipped with the reason where not; the
no-WebGPU note has a test; the capture script still records.

**Files affected:**
- `e2e/browser.ts`, `playwright.config.ts`, `e2e/smoke.spec.ts`,
  `e2e/home.spec.ts` (the note test), `e2e/capture.ts`, `.github/workflows/ci.yml`
  (only if the chromium channel needs an install change)

**What it does:**
- `browser.ts`: `LAUNCH_ARGS` per platform: Windows `['--enable-unsafe-webgpu',
  '--use-angle=d3d11', '--ignore-gpu-blocklist']`, else
  `['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan',
  '--ignore-gpu-blocklist']`. `playwright.config.ts`: `use.channel:
  'chromium'`.
- `smoke.spec.ts`: `CLOCKS` back to `SCENE_ROUTES` and `['/']`; a
  `beforeAll` probe of `navigator.gpu.requestAdapter()`; scene routes
  `test.skip`ped with "no WebGPU adapter in this browser; see H3N-59"
  when the probe fails; the ready check on the `webgpu` context.
- `home.spec.ts`: with `page.addInitScript` deleting `navigator.gpu`, `/`
  shows `h6.zero__webgpu` and no `canvas`.
- `capture.ts`: `--enable-unsafe-webgpu` added to `CAPTURE_ARGS`.

**Acceptance criteria:**
- [ ] On this machine, `pnpm test:e2e` runs the five scene routes on
      WebGPU (the report shows them passed, not skipped) and the note test
      passes.
- [ ] With `CHANNEL` forced to the headless shell (or the flags removed),
      the scene routes are reported skipped with the reason, and the rest
      passes.
- [ ] `pnpm capture after` records the five scenes without errors in
      `log.json`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` pass.

**Depends on:** tasks 2, 3, 4, 5.

**Risk:** GitHub Actions' Chromium may give no adapter. Then CI shows the
scene routes skipped with the reason, which is the agreed fallback; it is
seen when the branch is pushed.

### 7. Cleanup and the issue's answers

**Goal:** Nothing WebGL-only is left in the project or its dependencies,
and H3N-59's open questions are answered on the issue.

**Files affected:**
- `package.json`, `pnpm-lock.yaml` (remove `postprocessing`,
  `@react-three/postprocessing`, `vite-plugin-glsl`, `typed-glsl`,
  `gl-matrix`)
- `vite.config.ts` (drop the glsl plugin and the `*.glsl` watch)
- `src/types/*` (any `*.glsl` module declaration)
- `README.md` (one paragraph: WebGPU only, the alias, the smoke test)

**Acceptance criteria:**
- [ ] `pnpm ls postprocessing @react-three/postprocessing vite-plugin-glsl typed-glsl gl-matrix`
      reports none installed.
- [ ] `grep -rni "glsl\|ShaderMaterial\|onBeforeCompile\|GPUComputationRenderer\|postprocessing" src vite.config.ts`
      finds nothing except comments that say they are gone.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`,
      `pnpm test:e2e` pass.
- [ ] A comment on H3N-59 answers its three open questions (drei under
      WebGPU, headless WebGPU, removing the GLSL tooling) with what was
      found, and lists the by-eye sign-off, one line per element.

**Depends on:** task 6.
