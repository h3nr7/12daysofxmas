import { Canvas, extend, useFrame, useThree, type CanvasProps, type Viewport } from '@react-three/fiber';
import { useEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three/webgpu';

/**
 * An R3F canvas over three's `WebGPURenderer`. Children draw inside it and
 * import three from `three/webgpu`.
 *
 * Taken from h3nr7 `packages/lab/src/lib/webgpu-canvas.tsx` on 2026-11-21.
 * Written against three 0.185, proved on 0.187. Only this header comment
 * differs from the lab file.
 *
 * **Use this, not R3F's `Canvas` with plain `three`.** R3F builds `<mesh>` and
 * friends from one global catalogue, and this file points that catalogue at
 * `three/webgpu` when it loads. A plain-`three` WebGLRenderer would then be
 * handed objects from the other copy of three, and render nothing, without an
 * error. The README has the one rule and the alias recipe.
 *
 * `WebGPURenderer` falls back to WebGL2 by itself where WebGPU is missing.
 */

// Module scope: the catalogue is global, and this is the same `extend` the
// background makes. Harmless to repeat.
extend(THREE as never);

export function WebGPUCanvas({
  children,
  ...props
}: Omit<CanvasProps, 'gl' | 'children'> & { children?: ReactNode }) {
  return (
    <Canvas
      dpr={[1, 2]}
      {...props}
      // Async because acquiring a GPU adapter is; R3F suspends until `init()`
      // resolves. No MSAA: with it on, three's WebGPU backend bakes the
      // multisample buffer at the canvas's initial 300×150 (Stage.tsx).
      gl={async (glProps) => {
        const renderer = new THREE.WebGPURenderer({
          ...glProps,
          alpha: true,
          antialias: false,
        } as never);
        await renderer.init();
        return renderer;
      }}
    >
      <SettleSize />
      {children}
    </Canvas>
  );
}

/**
 * The canvas's renderer, typed as what it is.
 *
 * R3F types `state.gl` as `WebGLRenderer` and that can't be augmented, but
 * `WebGPUCanvas` always hands it a `WebGPURenderer`. The two classes share no
 * ancestor, so the assertion goes through `unknown` (as `LiquidTrail` does).
 * Only valid inside a `WebGPUCanvas`.
 */
export function useWebGPURenderer(): THREE.WebGPURenderer {
  return useThree((state) => state.gl as unknown as THREE.WebGPURenderer);
}

export function useViewport(): Viewport {
  return useThree((state) => state.viewport)
}

/** Frames spent re-stating the size after a change. */
const SETTLE_FRAMES = 5;

/**
 * Re-states the size for the first few frames, and after every resize.
 *
 * R3F measures the element before the async renderer exists and only pushes a
 * size on change, so WebGPU's cached depth attachment can stay at 300×150 and
 * every frame is rejected: a blank canvas. `setSize` clears it. The background's
 * `InitialSize` is the same fix with the full story.
 */
function SettleSize() {
  const gl = useThree((state) => state.gl);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const dpr = useThree((state) => state.viewport.dpr);
  const framesLeft = useRef(SETTLE_FRAMES);

  useEffect(() => {
    framesLeft.current = SETTLE_FRAMES;
  }, [width, height, dpr]);

  useFrame(() => {
    if (framesLeft.current <= 0 || width <= 0 || height <= 0) return;
    framesLeft.current -= 1;
    if (dpr > 0) gl.setPixelRatio(dpr);
    gl.setSize(width, height, true);
  });

  return null;
}
