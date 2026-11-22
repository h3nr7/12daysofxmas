# flock

## What it is

A flock of butterflies: boids from three local rules (separation,
alignment, cohesion), simulated on the GPU with three's TSL compute, drawn
as one instanced mesh, fleeing the pointer. The h3nr7 site's background,
stripped to the flock itself so any React Three Fiber project on WebGPU can
copy it in.

Eleven files, self-contained. The only imports that leave the folder are
`react`, `@react-three/fiber`, `three/webgpu` and `three/tsl`; the two
specs also import `vitest`, and `forces.spec.ts` checks the maths against
three's own transforms from `three/webgpu` (which loads under Node), so
no bare `three` import comes with the copy.

| File | What it holds |
|---|---|
| `index.ts` | everything below, re-exported |
| `Flock.tsx` | the ready-made component: boid space, the pointer ray, the repeller and the forces |
| `Boids.tsx` | the two compute passes, the buffers, `useBoids` |
| `Butterfly.tsx` | the bird: geometry, palette, flap, flight basis |
| `forces.ts`, `forces.spec.ts` | `FlockForce`, `stepForce`, `toBoidPoint` |
| `repeller.ts`, `repeller.spec.ts` | `Repeller`, `PointerState`, `pointerEngaged`, `toLocalRay`, `stepStrength` |
| `ray.ts` | `FrameRay`, `RayCamera`, `createRay`, `pointerRay` |
| `ease.ts` | `damp` |
| `README.md` | this |

## Exports

From `index.ts`:

- Components and hooks: `Flock`, `Boids`, `useBoids`, `Butterfly`.
- Control maps: `alignmentWeight(a)` (0..1 to 0..4) and `speedScale(s)`
  (0..1 to 6..24), the shader's terms for the `alignment` and `speed` props.
- Forces: `FlockForceKind`, `FlockForce`, `FLOCK_FORCE_DEFAULTS`,
  `FLOCK_FORCE_LIMITS`, `LiveForce`, `BoidForce`, `BoidForces`,
  `DEPTH_RANGE`, `MIN_DISTANCE`, `createLiveForce`, `createBoidForce`,
  `stepForce`, `toBoidPoint`.
- Repeller: `Repeller`, `PointerState`, `FADE_RATE`, `pointerEngaged`,
  `toLocalRay`, `stepStrength`.
- Ray: `FrameRay`, `RayCamera`, `createRay`, `pointerRay`.
- Easing: `damp`.
- Prop types: `FlockProps`, `BoidsProps`, `BoidsCtx`, `ButterflyProps`.

## `Flock` props

```tsx
<Flock colours={['#17171a', '#595a5f']} />
```

| Prop | Default | What it does |
|---|---|---|
| `count` | 1000 | how many birds; the cost grows with the square of this |
| `scale` | 0.05 | boid units to world units |
| `tilt` | `[1.2, 0, 0]` | the group's rotation, radians |
| `colours` | `['#17171a']` | the palette, one picked per bird |
| `opacity` | 0.075 | every bird's alpha |
| `fade` | none | a `{ current }` ref, 0..1, multiplied into the opacity, read every frame |
| `pointer` | `true` | whether the pointer repels; false keeps the strength at 0 |
| `repellerRadius` | 70 | boid units from the ray a bird feels it. Passed to `Boids` as `preyRadius`, so it is also the reach of the default predator attractor at (0, 30, 0) |
| `repellerStrength` | 1 | how hard the ray pushes |
| `attractor`, `repeller` | `null` | a `FlockForce` each, screen-relative, eased in and out; null is off |
| `alignment`, `speed` | 0.5 | passed to `Boids` |
| `depthTest` | `true` | passed to `Butterfly` |

The flock sits in a group at the origin, scaled and tilted. It is sized for
a perspective camera about 30 units back at fov 45; with another camera,
change `scale`. An orthographic camera leaves the pointer and the forces
where they are.

A `FlockForce` is `{ x, y, depth, strength, radius }`: `x` and `y` across
the viewport, -1 to 1, y up; `depth` through the flock, -1 its near side to
1 its far side; `strength` 0 to 3; `radius` as a fraction of the screen's
half-height. `FLOCK_FORCE_DEFAULTS` is a whole one (centre, strength 2,
radius 0.5) to spread over. Nothing clamps to `FLOCK_FORCE_LIMITS`; a
caller that takes values from outside should.

The pointer repels while a mouse or pen is over the canvas, and while a
finger is down. That is read from `pointerenter`, `pointerleave`,
`pointerdown`, `pointerup` and `pointercancel` on the canvas element; the
ray comes from R3F's `state.pointer`, which R3F updates as the pointer
moves over the canvas.

## `Boids` and `Butterfly` props

`Boids` runs the simulation and provides the buffers through context. It
draws nothing: its children do.

| Prop | Default | What it does |
|---|---|---|
| `count` | 15000 | how many birds |
| `alignment`, `speed` | 0.5 | the controls, 0..1, eased over 0.6 s |
| `repeller` | none | a `{ current: Repeller }` ref, a line in boid space the birds flee |
| `forces` | none | a `{ current: BoidForces }` ref, the two forces already in boid space |
| `separationDistance`, `alignmentDistance`, `cohesionDistance` | 10 each | the three zones, boid units |
| `preyRadius` | 50 | how far the attractors and the repeller line reach |
| `flapMeanFrequency` | 40 | spreads the wing phases at the start |
| `attractors` | one at (0, 30, 0), strength 5 | predators, as `Vector4` (xyz, strength) |
| `centralAttractor` | origin | where the flock is pulled to |

`Butterfly` draws one bird per boid from the context.

| Prop | Default | What it does |
|---|---|---|
| `colours` | required | the palette, one picked per bird by a hash of its index |
| `opacity` | 1 | every bird's alpha |
| `fade` | none | a `{ current }` ref, 0..1, multiplied into the opacity |
| `depthTest` | `true` | depth test and depth write; off for a canvas with no depth buffer or a background that draws over everything |

## Composing `Boids` with another bird

`useBoids()` returns `{ count, positionBuffer, velocityBuffer,
velocityNextBuffer, phaseBuffer }`: TSL storage buffers, one slot per bird,
written by the compute passes every frame. A bird of your own is a mesh
with an `instancedBufferGeometry` (`instanceCount={count}`) and a node
material whose vertex stage reads its bird's slot:

```ts
const { count, positionBuffer, velocityBuffer, phaseBuffer } = useBoids();
const position = positionBuffer.element(instanceIndex);   // where the bird is, boid units
const velocity = velocityBuffer.element(instanceIndex);   // where it is going
const phase = phaseBuffer.element(instanceIndex);         // its wing beat, 0..2π
material.positionNode = oriented(positionLocal, velocity, phase).add(position);
```

`Butterfly.tsx` is the worked example: it builds a flight basis from the
velocity (forward, right, up), flaps the wings with `phase`, rotates the
local vertex into that basis and adds the position. Set `frustumCulled`
false on the mesh: the positions come from the buffer, so three's bounds for
the geometry say nothing about where the birds are. Leave
`velocityNextBuffer` alone; it is the compute passes' scratch.

```tsx
<group scale={0.05} rotation={[1.2, 0, 0]}>
  <Boids count={1000} repeller={repellerRef}>
    <Parrot />
  </Boids>
</group>
```

## Dependencies

| Package | Range | Kind |
|---|---|---|
| `three` | `^0.187.0` | dependency |
| `@types/three` | `^0.187.0` | dev dependency |
| `@react-three/fiber` | `^9.8.0` | dependency |
| `react` | `^19.2.0` | dependency |
| `react-dom` | `^19.2.0` | dependency |

`three` is for `three/webgpu` and `three/tsl`, and ships no types, hence
`@types/three`. The two spec files need `vitest` as a dev dependency; a
project without a test runner can exclude `**/*.spec.*` in its tsconfig
instead, or the type-check fails on their imports.

## Needs a WebGPU canvas

The flock runs only on three's `WebGPURenderer` with a WebGPU adapter: the
compute passes have no WebGL path, and `WebGPURenderer`'s WebGL2 fallback
draws nothing of it. Mount it inside the `webgpu-canvas` reference, which
is R3F's `Canvas` over an async `WebGPURenderer`:

```tsx
<WebGPUCanvas camera={{ position: [0, 0, 30], fov: 45 }}>
  <Flock colours={['#17171a', '#595a5f']} />
</WebGPUCanvas>
```

The one rule: import three from `three/webgpu` everywhere, never from
`three`. The canvas calls R3F's `extend` with `three/webgpu`, and a mesh or
material from the other copy of three is one the renderer cannot draw,
without an error. Every file here does; a dependency that imports `three`
(drei, meshline) needs the alias recipe in the canvas reference's README.

## Specs

`forces.spec.ts` and `repeller.spec.ts` run under Vitest with no GPU and
no DOM. `forces.spec.ts` imports `three` (core) to check `toBoidPoint`
against three's own transforms and projection; it is the one place `three`
is imported bare. With `vitest` installed and `src/**/*.spec.ts` in its
`include`, `pnpm vitest run` runs them: 31 tests.

## Taken from

h3nr7 `packages/canvas/src/visuals/flock/` (`Boids.tsx`, `Butterfly.tsx`,
`Flock.tsx`, `forces.ts`, `repeller.ts` and their specs) and
`packages/canvas/src/lib/` (`ray.ts`, `damp` from `pointer.ts`, the types
and defaults from `flock-forces.ts`, `alignmentWeight` and `speedScale`
from `flock-controls.ts`), on 2026-11-21, written against three 0.185 and
proved on three 0.187. Each file's header says which file it came from and
what changed. Left behind: the stores (`flock-controls`, `flock-forces`),
the dev controls, the theme's colour token, `presence`, the Blobby
fallback, the repeller overlay and `palette.ts`.
