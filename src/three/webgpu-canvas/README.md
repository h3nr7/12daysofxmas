# webgpu-canvas

An R3F canvas over three's `WebGPURenderer`. One file, `WebGPUCanvas.tsx`,
with three exports: `WebGPUCanvas`, `useWebGPURenderer` and `useViewport`.
Copy the folder into a project and render your scene inside `WebGPUCanvas`.

## What it is

`WebGPUCanvas` is React Three Fiber's `Canvas` with its `gl` prop fixed to
an async `WebGPURenderer` factory (`alpha: true`, `antialias: false`). R3F
suspends until the renderer has acquired a GPU adapter. Every other
`Canvas` prop passes through; `dpr` defaults to `[1, 2]`.

It also mounts `SettleSize`, which re-states the canvas size for the first
few frames and after every resize. Without it WebGPU's depth attachment can
stay at the canvas's initial 300 by 150 and every frame is rejected: a blank
canvas.

`useWebGPURenderer()` returns R3F's `state.gl` typed as `WebGPURenderer`,
which is what this canvas always hands it. `useViewport()` returns R3F's
`state.viewport`.

`WebGPURenderer` falls back to WebGL2 by itself where WebGPU is missing. The
reference adds no fallback of its own.

## Dependencies

| Package | Range | Kind |
|---|---|---|
| `three` | `^0.187.0` | dependency |
| `@types/three` | `^0.187.0` | dev dependency |
| `@react-three/fiber` | `^9.8.0` | dependency |
| `react` | `^19.2.0` | dependency |
| `react-dom` | `^19.2.0` | dependency |

`three` ships no types of its own, so `@types/three` is needed for the type
check and the build.

## What to wire

1. Import `WebGPUCanvas` from the copied file and render it where the
   canvas goes. Give it a size with `style` or a sized parent; it fills
   its parent like R3F's `Canvas`.
2. Render the scene as its children. R3F's `<mesh>`, `<group>` and the
   rest work as usual.
3. Import three from `three/webgpu` everywhere, never from `three`. See
   the one rule below.

```tsx
import { WebGPUCanvas } from './webgpu-canvas/WebGPUCanvas';

export function App() {
  return (
    <WebGPUCanvas style={{ position: 'absolute', inset: 0 }}>
      <mesh>
        <boxGeometry />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </WebGPUCanvas>
  );
}
```

Inside the canvas, `useWebGPURenderer()` gives the renderer for compute
passes and `useViewport()` the viewport in world units.

## The one rule

There are two copies of three: `three` and `three/webgpu`. They export the
same class names, but a `Mesh` from one is not a `Mesh` to the other.

`WebGPUCanvas.tsx` calls R3F's `extend` with `three/webgpu` at module
scope, so R3F's catalogue (`<mesh>`, `<boxGeometry>` and the rest) is built
from `three/webgpu`. Everything the renderer touches must come from the
same copy. So: import three from `three/webgpu` everywhere, in every file
of the project, and never from `three`.

A file that imports from `three` renders nothing, without an error.

## The alias recipe

A dependency that imports `three` itself (`@react-three/drei`, `meshline`,
anything else that imports `three`) breaks the one rule from inside
`node_modules`. Point the bare name at a shim that re-exports
`three/webgpu`:

```ts
// src/three-webgpu.ts
// One copy of three: everything resolves to the WebGPU build.
export * from 'three/webgpu';
export { CubeRenderTarget as WebGLCubeRenderTarget } from 'three/webgpu';

// The WebGPU build has no WebGL renderer and none of its GLSL tables. Some
// dependencies (drei through three-stdlib and gainmap-js) import these names
// at module scope without using them here, and some call them there too: in
// dev, the dependency optimiser bundles all of three-stdlib untree-shaken, and
// its Sky runs `UniformsUtils.clone(...)` as the module loads. So each name is
// an inert stand-in: property reads and calls hand the stand-in back, and only
// `new` throws, so creating a WebGL renderer fails with a clear message.
function unavailable(name: string): never {
  throw new Error(`three's ${name} is not available: this project renders with three/webgpu`);
}
function standIn(name: string): any {
  const target = function () {};
  const proxy: any = new Proxy(target, {
    get: (_t, key) => (key === Symbol.toPrimitive ? () => `[${name}]` : proxy),
    apply: () => proxy,
    construct: () => unavailable(name),
  });
  return proxy;
}
export const WebGLRenderer = standIn('WebGLRenderer');
export const WebGLUtils = standIn('WebGLUtils');
export const ShaderChunk = standIn('ShaderChunk');
export const ShaderLib = standIn('ShaderLib');
export const UniformsLib = standIn('UniformsLib');
export const UniformsUtils = standIn('UniformsUtils');
```

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url'
// ...
resolve: {
  alias: [
    { find: /^three$/, replacement: fileURLToPath(new URL('./src/three-webgpu.ts', import.meta.url)) },
  ],
},
```

The target must be an absolute file path. A root-relative
`'/src/three-webgpu.ts'` passes the production build but breaks `vite`
dev: the dependency optimiser resolves it relative to each dependency
and fails with "Could not load ../../../src/three-webgpu.ts". The
`node:url` import needs `@types/node` as a dev dependency and
`"types": ["node"]` in the tsconfig that covers `vite.config.ts`
(`tsconfig.node.json` in Vite's template). After changing the shim, start
the dev server once with `--force`: the optimiser bundles the shim into
its pre-bundled chunk and does not see edits to it otherwise.

The regex matches the bare specifier only, so `three/webgpu` and
`three/tsl` resolve as they are. The second export line covers
`WebGLCubeRenderTarget`, which drei's barrel imports and `three/webgpu`
names `CubeRenderTarget`. The stand-ins cover the other six names the
WebGPU build lacks (three 0.187: `WebGLRenderer`, `WebGLUtils`,
`ShaderChunk`, `ShaderLib`, `UniformsLib`, `UniformsUtils`); without them
the production build fails with "is not exported" from three-stdlib and
gainmap-js, which drei pulls in, even though the dev server runs. To
check the list against another three version:

```sh
node -e "const f=require('fs'),n=p=>new Set([...f.readFileSync(p,'utf8').matchAll(/export \{([^}]*)\}/g)].flatMap(m=>m[1].split(',').map(s=>s.trim().split(/\s+as\s+/).pop())));const a=n('node_modules/three/build/three.module.js'),b=n('node_modules/three/build/three.webgpu.js');console.log([...a].filter(x=>!b.has(x)).join(' '))"
```

Proved on 2026-11-21 with drei 10.7.9: build, type-check and the page on
WebGPU all pass with drei's `OrbitControls` rendered
(`docs/proofs/flock-proof/`). Proved again on 2026-11-22 in 12daysofxmas
(drei, three-stdlib, @react-spring/three, meshline gone): `vite` dev and
`vite preview` both render four routes on WebGPU with no console errors,
which is what found the absolute-path and inert-call fixes above.

When it is needed: only when the project has a dependency that imports
`three`. A project whose own code follows the one rule needs no alias.

## Taken from

h3nr7 `packages/lab/src/lib/webgpu-canvas.tsx`, on 2026-11-21. Written
against three 0.185. Proved on three 0.187 with React Three Fiber 9.8.
`WebGPUCanvas.tsx` differs from the lab file only in its header comment.
