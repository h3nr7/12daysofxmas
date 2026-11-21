# WebGPU and shared references: story design

Date: 2026-11-21
Status: approved
Size: large story
Linear: H3N-59 (feature 2); features 1 and 3 to be created
Project: 12daysofxmas (feature 2, H3N-59); h3nr7 coding tools (features 1 and 3)
Builds on: 2026-11-21-revival-design.md (H3N-63, done); 2026-11-21-debug-mode-design.md (H3N-78, done)

## Intent

Move 12daysofxmas's 3D scenes from WebGL to three's WebGPU renderer, so the
days still to build can use compute shaders and node-based effects. Do it by
way of h3nr7-coding-tools: the h3nr7 flock, the h3nr7 WebGPU canvas and the
h3nr7 ui become reference components there, with a skill that copies one into
any h3nr7 project. The boids and the canvas in 12daysofxmas are the first
things pulled in that way.

H3N-59 tracks the WebGPU switch. It said the work needed its own design
before any build. This is that design, at story level. Each feature gets its
own design in turn.

## Goals

- 12daysofxmas renders every mounted scene on three's `WebGPURenderer`, with
  no GLSL, `ShaderMaterial` or `onBeforeCompile` left in the project.
- h3nr7-coding-tools holds a flock reference, a WebGPU canvas reference and
  a ui reference, and a skill that lists them, copies one into a project,
  adds its dependencies and says what to wire.
- The flock and canvas references are self-contained: three and React Three
  Fiber are their only dependencies, and they have no h3nr7 stores, dev
  panel or colour tokens.
- The ui reference is font independent: faces are named as tokens with
  system fallbacks, and no Adobe kit comes with it.
- Every element in every mounted scene is present and moving on WebGPU: boids
  with wings flapping, bloom, grain, tilt-shift, stars, trails, the diamond,
  the text, the satellite, and the Christmas scenes with their physics.
- Type-check, lint, build, unit tests and CI stay green, as the revival set
  them up.

## Non-goals

- Adopting the h3nr7 ui in 12daysofxmas. Its SCSS, styled-components and
  motion UI stays.
- Any WebGL fallback, in the references or in the scenes.
- shadcn's half of the h3nr7 ui package in the reference.
- The parrot renderer, the dev controls, the callable forces and the debug
  overlay in the flock reference.
- Publishing the references as packages, or giving coding-tools a build,
  tests or CI of its own.
- Matching the old scenes in look or timing.
- New scenes, and wiring up Second, Third and Fourth.
- Changing the h3nr7 monorepo. It is read, not written, even where the
  reference improves on it.
- Firefox and Safari in the smoke test, as the revival left them.
- Cloudflare hosting, H3N-60.

## Anti-goals

The story has failed, even if every check is green, if:

- a reference still reaches into h3nr7-only modules, so a project that
  pulls it in has to bring those too;
- an effect or helper is rewritten by hand when three, fiber or an installed
  library already provides it for WebGPU;
- a WebGL path is kept alive "just in case", so two renderers have to be kept
  working;
- the smoke test is silenced rather than either run on WebGPU or skipped with
  its reason written beside it;
- the h3nr7 monorepo is edited to make the copy easier;
- a test pins a 3D scene to what WebGL did.

## Constraints

- **WebGPU only.** Every three import is `three/webgpu` or `three/tsl`.
- **Library first.** A thing is written only when three, fiber or an
  installed library has no WebGPU version of it. Checked against the
  installed versions on 2026-11-21 (three 0.187, drei 10.7.9, fiber 9.8.2,
  rapier 2.2, react-spring 10.1, camera-controls 3.1, postprocessing 6.39):
  - three provides `PostProcessing`, `pass`, `bloom` (BloomNode), `film`
    (FilmNode), tone mapping on output, `PointsNodeMaterial`,
    `Line2NodeMaterial`, `SpriteNodeMaterial`, `CubeCamera` with
    `CubeRenderTarget`, and equirectangular environment mapping;
  - written by hand: the tilt-shift mask, the stars' twinkle, the trail's
    ring of positions, the parrot vertex stage, the satellite's point
    shaping;
  - drei has no WebGPU versions of `Stars`, `Trail`, `CubeCamera` or
    `MeshRefractionMaterial`; pmndrs `postprocessing` and
    `@react-three/postprocessing` are WebGL only.
- **One copy of three in 12daysofxmas.** Every import of `three`, in the
  project and in every dependency, resolves to the WebGPU build through a
  Vite alias, the way three's own WebGPU examples do with an import map.
  Verified against the installed packages: fiber, rapier and react-spring
  resolve every name they import; camera-controls imports three as a
  namespace; drei alone imports one name the WebGPU build lacks,
  `WebGLCubeRenderTarget`, in `CubeCamera`, `Environment` and `Preload`,
  none of which the project uses once the CubeCamera uses are replaced. The
  alias points at a tiny module that re-exports the WebGPU build and adds
  that one name, so drei's barrel still links.
- **References are copies, not packages.** A project owns what it pulled in
  and may edit it. A flaw found in 12daysofxmas is fixed in the reference
  too, by hand, within feature 2.
- **Font independence.** The ui's `--font-display`, `--font-body` and
  `--font-mono` keep their names with system fallback stacks and no Adobe
  faces. Components name tokens, never faces. `fonts.css` stays in h3nr7.
- **Movement only has to work, never like for like.** The bar for every
  rewrite and every test is: it renders, it functions, it throws no errors.
  Each element is signed off by eye as present and moving. No capture
  comparison, and no test that pins a timing, a pixel or a layout of a 3D
  scene to what WebGL did.
- **Versions.** The references are taken from h3nr7's three 0.185 and first
  consumed on 0.187. Each README names the version it was written against.
- **Order.** Feature 1 ships before feature 2's design is written. Feature
  2's first task runs the skill. Feature 3 depends on nothing and can be
  built beside feature 2.
- The revival's working rules carry over: one commit per task, every check
  that exists green at the end of each task, pnpm.

## Where the work stands

**12daysofxmas** (after the revival, H3N-63, and debug mode, H3N-78, both
merged into `develop`): React 19, React Router 8, react-three-fiber 9,
drei 10, three 0.187, `@react-spring/three` for 3D animation, Vitest units,
a Playwright smoke test of the five mounted scenes on software WebGL in
headless Chromium, ESLint 10, CI on every push, and a `?debug` mode that
shows Stats, the camera helper and a fake date.

What has to change, by file:

| Part | Today | Why it cannot stay |
|---|---|---|
| `src/three/ThreeView.tsx` | R3F `Canvas` with the default WebGL renderer | the renderer |
| `src/three/components/Boids/` | `GPUComputationRenderer`, four GLSL shaders, `onBeforeCompile` on a `MeshStandardMaterial` in `BoidsGltf.tsx`; 256 parrots from `Parrot.glb` with the wing morph baked into a `DataTexture`; used by Eighth, Sandbox and the unmounted Sixth | WebGL only |
| `src/three/components/EffectControls/` | pmndrs `EffectComposer` with `Bloom`, `ToneMapping` (ACES), optional `Noise` and a custom `Tiltshift` effect in GLSL, switched per scene from the store | WebGL only |
| `Stars` in `ThreeView.tsx` | drei, a GLSL `ShaderMaterial` | GLSL |
| `Trail` in `OrbitalTrails.tsx` | drei, meshline GLSL | GLSL |
| `CubeCamera` in `Diamond.tsx` and `BlockText.tsx` | drei, `WebGLCubeRenderTarget` | WebGL only |
| `Satellite.tsx` | `ShaderMaterial` with two tiny GLSL files | GLSL |
| `vite.config.ts` | `vite-plugin-glsl` | nothing left to compile once the GLSL is gone |

Unaffected: models through `useGLTF`, standard materials, lights, rapier
physics, `CameraControls`, `Text3D`, `Stats`, react-spring, debug mode, and
all the HTML UI.

**h3nr7 monorepo**: `packages/canvas/src/visuals/flock/` is already WebGPU
and TSL. `Boids.tsx` runs two compute passes over `instancedArray` storage
buffers (decide velocity, then commit position, velocity and phase), with a
central attractor, predator attractors, a pointer repeller line and two
callable forces as uniforms. `Butterfly.tsx` draws instanced flat geometry on
a `MeshBasicNodeMaterial` whose position node reads those buffers, flaps by
phase and orients by velocity. `Flock.tsx` places boid space in the world
(scale 0.05, a tilt), converts the stage's pointer ray into boid space each
frame and steps the repeller's strength. `forces.ts`, `repeller.ts` and
`palette.ts` are pure, with specs. The flock reads h3nr7-only modules:
`lib/frame`, `lib/ray`, `lib/flock-controls`, `lib/flock-forces`,
`lib/colour`, `lib/use-dev-controls`, `lib/drawn`. The lab's
`lib/webgpu-canvas.tsx` is a 90-line R3F canvas over `WebGPURenderer` with
the async factory, no MSAA, the settle-size component and a typed renderer
hook; the stage's `Stage.tsx` holds the long notes on why. `packages/ui` is
h3nr7's own components (Dialog, Drawer, Tooltip, Popover, Switch, Slider,
Controls, Field, Nav, ScrambleText), a lib (`cn`, `reveal-queue`,
`use-mobile`), `tokens.css`, `scramble.css`, `fonts.css`, and shadcn's
unedited set for the `/internal` console.

**h3nr7-coding-tools**: a Claude Code plugin of four skills and nothing
else, at version 0.3.0, installed from its GitHub marketplace. No
package.json, no tests, no CI, no release rule written down. Reference
components are a new kind of content for it.

## Approaches

Four were considered.

- **Keep the `GPUComputationRenderer` boids.** Dropped: it is WebGL only and
  does not exist in three's WebGPU build.
- **Translate the GLSL to raw WGSL by hand.** Dropped: the h3nr7 flock
  already exists in TSL, and the owner wants it as the shared reference.
- **A. Reference first, then pull it in.** Feature 1 derives the flock and
  canvas references from h3nr7, strips the stores, and ships the skill.
  Feature 2's first task runs that skill on 12daysofxmas, then builds the
  parrot renderer on the reference's buffers, and rebuilds the effects and
  helpers one by one. Gives: the skill proven on its first real use, and a
  reference shaped before a second consumer bends it. Costs: a round trip
  when 12daysofxmas finds a flaw in the reference.
- **B. Rewrite 12daysofxmas first, extract after.** Feature 2 copies the
  h3nr7 flock by hand and does the whole switch; feature 1 then extracts the
  reference from two working consumers. Gives: a reference shaped by two
  real users. Costs: the skill goes untested on real work, and the hand copy
  and the reference can drift before extraction.

**Chosen: A**, by the owner, on the recommendation that the only way to know
the skill works is to use it for the pull it was made for.

## The design

### How it fits together

```
h3nr7 monorepo       packages/canvas flock    packages/lab webgpu-canvas    packages/ui
                            │ stripped of stores        │ as is                   │ fonts as tokens, no Adobe kit
                            ▼                           ▼                         ▼
h3nr7-coding-tools   references/flock/         references/webgpu-canvas/    references/ui/
                     skills/h3nr7-components/   lists them, copies one in, adds deps, says what to wire
                            │ the skill, run twice on 12daysofxmas (canvas, then flock)
                            ▼
12daysofxmas         src/three/ThreeView.tsx          the canvas reference, plus the alias for drei
                     src/three/components/Boids/      the flock reference + BoidsParrot.tsx (TSL)
                     EffectControls                   three's PostProcessing: bloom, film, tone mapping, tilt-shift
                     Stars, Trail, CubeCamera, Satellite   hand-built on node materials
                     App.tsx                          WebGPU check before the canvas mounts
```

Three repos, one direction of flow. The h3nr7 monorepo is only read.
coding-tools gains a references folder and one skill. 12daysofxmas is the
only place where scenes change.

In 12daysofxmas there is one copy of three, through the Vite alias described
under constraints. The canvas reference also calls R3F's `extend` with the
WebGPU build at module scope, as the lab's does; the two are compatible, and
the alias is what drei needs on top.

Before the canvas mounts, the app asks the browser for a WebGPU adapter. With
one, the canvas mounts as today. Without one, no canvas is mounted. The canvas
area stays the universe background colour, and under the title on the home
page, in the existing text style, one line says the scenes need a browser
with WebGPU and names Chrome, Edge, Safari 26 and Firefox. Every route still
shows its HTML.

### Features

**Feature 1. The flock and canvas references, and the skill, in
h3nr7-coding-tools.**
Project: h3nr7 coding tools. Linear: to be created. Depends on nothing.

- `references/webgpu-canvas/`: the lab's `webgpu-canvas.tsx` as is:
  `WebGPUCanvas` (async `WebGPURenderer` factory, no MSAA, `extend` at
  module scope), `SettleSize`, `useWebGPURenderer`, `useViewport`. Its
  README gives the one rule, that three comes from the WebGPU build, and
  the alias recipe for a project whose dependencies (drei) import `three`.
- `references/flock/`: `Boids.tsx` with its two compute passes and the
  `useBoids` context exposing the buffers and count; `Butterfly.tsx`; and a
  stripped `Flock.tsx` that places boid space in the world (count, scale,
  tilt as props), builds the pointer's ray from R3F's own `pointer` and
  `camera`, converts it into boid space and steps the repeller's strength
  each frame. The repeller stays a plain ref prop on `Boids`
  (`{ current: Repeller }`), so a consumer that composes `Boids` with its
  own bird, as 12daysofxmas does with the parrot, gets the same wiring.
  Colours, opacity and a fade value are props. The predators and central
  attractor are props, as they are. `forces.ts` and `repeller.ts` come with
  their specs, with h3nr7's `FrameRay` and `RayCamera` types replaced by the
  small structural types they need. Gone: `lib/flock-controls`,
  `lib/flock-forces`, `lib/colour` and the palette token,
  `lib/use-dev-controls`, `lib/drawn`, presence, `RepellerOverlay`. A README
  states the props, the two dependencies (`three`, `@react-three/fiber`),
  the three version it was written against, and that it needs the canvas
  reference or an equivalent.
- `skills/h3nr7-components/`: lists the references, asks for the target
  path, copies the folder in, adds its dependencies with the project's
  package manager, and says what to wire, from each README. The plugin's
  README and manifest gain the skill and the references folder, and the
  version goes to 0.4.0.

**Feature 2. 12daysofxmas on WebGPU.**
Project: 12daysofxmas. Linear: H3N-59. Depends on feature 1. Its own design
is written when feature 1 is done, and covers:

- the canvas: the skill run for `webgpu-canvas`, `ThreeView.tsx` on
  `WebGPUCanvas`, the alias and its shim module for drei, ACES tone mapping
  on the renderer, the WebGPU check in `App.tsx` and the note;
- the boids: the skill run for `flock`; the reference `Boids` as the
  simulation, and `BoidsParrot.tsx`, a TSL vertex stage that reads a bird's
  position, velocity and phase from the buffers through `useBoids`, samples
  the parrot's baked animation texture, and builds the flight basis, as the
  GLSL patch in `BoidsGltf.tsx` does. Eighth, Sandbox and Sixth use it.
  `BoidsSimple` and the GLSL go;
- effects: three's `PostProcessing` with the scene pass, `bloom`, `film` for
  the noise, tone mapping on output, and the tilt-shift as a short TSL
  composition of a blur masked by distance from a line across the screen.
  The store's `noise` and `tiltshift` flags keep their meaning;
- helpers: `Stars` as points on a `PointsNodeMaterial` with the twinkle in
  the node graph; `Trail` on a `Line2NodeMaterial` fed a ring of recent
  positions; the two `CubeCamera` uses replaced by the RGBE texture as an
  equirectangular environment map on the material; `Satellite` on a node
  material with its size and resolution as uniforms;
- tests: the headless WebGPU spike first, then the smoke test kept on WebGPU
  or the scene routes skipped with the reason;
- cleanup: `postprocessing`, `@react-three/postprocessing`,
  `vite-plugin-glsl` and `typed-glsl` removed once nothing imports them, and
  the H3N-59 open questions answered on the issue.

**Feature 3. The ui reference in h3nr7-coding-tools.**
Project: h3nr7 coding tools. Linear: to be created. Depends on nothing; can
be built beside feature 2.

- `references/ui/`: h3nr7's own components, the lib, `tokens.css` with the
  font families over system fallbacks, and `scramble.css`. Not shadcn's set,
  not `fonts.css`. A README says which components need Tailwind and which
  are plain, and names Radix and the lib dependencies. The skill's list
  gains it.

### Testing

- **Feature 1.** The flock's pure helpers keep their unit tests, which run
  in the throwaway Vite project the skill is tried on. That try is the
  feature's acceptance: a fresh R3F project, the skill run for the canvas
  and then for the flock, butterflies flying and fleeing the pointer in
  Chrome, checked by eye. The skill is read as a reviewer would: it names
  what it copies, what it installs and what to wire.
- **Feature 2.** Vitest units for the pure parts the rewrites create, such
  as the tilt-shift's line maths and the trail's ring. The Playwright smoke
  test after the spike: on WebGPU, the five scene routes keep their
  mount-and-no-errors check; otherwise those routes are skipped with the
  reason beside them and the home and HTML routes still run. A sign-off by
  eye with one line per element: boids with wings moving, bloom, grain,
  tilt-shift, stars, trails, the diamond, the text, the satellite, and the
  Christmas scenes with their physics. The note is checked once in a browser
  with WebGPU switched off. Nothing is compared like for like.
- **Feature 3.** The ui's spec files run in a scratch Vite project with
  Tailwind, Radix and jsdom, and one component renders without the Adobe
  faces.
- **Across all.** Type-check, lint, build and CI green per task where the
  repo has them.

### Not doing

See the non-goals.

## Decisions

Made by the owner, in the order they were made:

1. The ui is made available in coding-tools only; 12daysofxmas does not
   adopt it.
2. WebGPU only; no WebGL fallback.
3. The parrot stays, with its wing animation, on the reference flock.
4. All four effects stay, but an effect is rewritten only when no library
   provides it for WebGPU.
5. Smoke tests try headless WebGPU first and otherwise skip the scene routes
   with the reason.
6. The flock reference is the core plus the pointer repeller, with stores,
   dev controls, colour token, presence and overlay stripped.
7. References are pulled in by a skill that copies them, not by a package.
8. Approach A, reference first.
9. coding-tools work lives in the h3nr7 coding tools project; feature 2 is
   H3N-59 in 12daysofxmas.
10. Without WebGPU: one line on the page in the existing style, HTML still
    works.
11. The ui reference is h3nr7's own components only, not shadcn's set.
12. Nothing is tested like for like against the WebGL scenes.

From the builder check, settled by me and open to overruling:

- **The WebGPU canvas is a third reference.** Both feature 1's proving
  ground and feature 2 needed the same async renderer, no-MSAA setting and
  settle-size component, so it is `references/webgpu-canvas/`, shipped by
  feature 1 and pulled in by feature 2 with the skill. Feature 2's first
  task runs the skill twice.
- **The flock reference includes a stripped `Flock.tsx`.** "Fleeing the
  pointer" needs the ray and the repeller stepping, and every consumer would
  otherwise write it from the README. The ray comes from R3F's `pointer` and
  `camera`, not h3nr7's frame.
- **The ui reference is feature 3, not part of feature 1.** Nothing in the
  story consumes it, it needs a different proving ground (Tailwind, Radix,
  jsdom), and leaving it in feature 1 would block H3N-59 on it. Nothing is
  lost: it is still built, and can run beside feature 2.
- **"Ships" means committed on a branch with the version at 0.4.0.**
  Feature 2 runs the skill from the local checkout of coding-tools, by
  reading its SKILL.md, since the installed plugin lags. Pushing, merging
  and reinstalling the plugin are the owner's steps and are asked for at the
  end of feature 1, as the skills always do.
- **Feature 2 branches from `develop`.** The revival and debug mode are
  both merged there (PRs #2 and #3), and debug mode touched `App.tsx` and
  `Eighth.tsx`, which feature 2 edits. The worktree for this story is
  already on `feature/webgpu` off `origin/develop`.

My other calls:

- The alias is a regex on the bare name `three` only, pointing at a module
  that re-exports the WebGPU build and adds `WebGLCubeRenderTarget` as an
  alias of `CubeRenderTarget`, so drei's barrel links. `three/webgpu`,
  `three/tsl` and `three/examples/...` are not touched by it.
- References are copied by path, not published. The skill asks for the
  target path rather than guessing one.
- The parrot renderer lives in 12daysofxmas, not in the reference.
- coding-tools gains no toolchain. Spec files travel with a reference and
  run in whichever project pulls it in.
- The headless WebGPU spike is time-boxed to one task.
- The revival's capture videos are kept as the before reference for the
  sign-off, but there is no comparison, only presence and motion.
- Sixth, unmounted, gets the parrot so it still compiles.
- Features 1 and 3 have their designs and plans in h3nr7-coding-tools under
  `docs/plans/`; feature 2's live here. All take their header from this
  story.
- Work in 12daysofxmas happens in the `12daysofxmas-webgpu` worktree, since
  another session has the main checkout.

## How the owner knows it works

- In h3nr7-coding-tools: the skill, run on a fresh Vite R3F project for the
  canvas and then the flock, puts a flying, pointer-fleeing flock on screen
  in Chrome with three and fiber as its only added dependencies; later, the
  ui reference's components render with system fonts and their specs pass
  in a scratch project.
- In 12daysofxmas: every mounted scene renders on WebGPU in Chrome with each
  element present and moving; no page errors; the note shows in a browser
  without WebGPU; no GLSL, `ShaderMaterial`, `onBeforeCompile`,
  `postprocessing` or `vite-plugin-glsl` remains; type-check, lint, units,
  build and CI are green; the smoke test either runs the scenes on WebGPU or
  skips them with a written reason.

## Left to the builder

- The exact split of the flock reference into files, and the names of the
  structural types that replace h3nr7's `FrameRay` and `RayCamera`.
- The skill's wording and its handling of a project that already has the
  folder.
- The tilt-shift's blur choice (three's `gaussianBlur`, `hashBlur` or
  `boxBlur`) and its parameters, tuned by eye.
- The trail's ring length and the stars' twinkle rate, tuned by eye.
- The headless WebGPU flags for Chromium, locally and on GitHub Actions.
- How the parrot's animation texture is sampled in TSL (texture node with a
  computed uv, as the GLSL does).
