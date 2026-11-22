/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/Flock.tsx` on
 * 2026-11-21, stripped to the flock itself. Gone: the Blobby fallback for a
 * browser without WebGPU, the dev controls, the theme's colour token, the
 * stage's `presence` and camera contribution, the repeller overlay, and the
 * `flock-forces` store. What they fed is now props. The pointer's ray comes
 * from R3F's `state.pointer` and `state.camera`, and whether the pointer is
 * engaged from pointer events on the canvas element.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
// `three/webgpu`, not `three`: the canvas calls R3F's `extend` with it, and
// a second copy of three would hand the renderer objects it cannot draw.
import { Matrix4, type Group, type PerspectiveCamera } from 'three/webgpu';
import { Boids } from './Boids';
import { Butterfly } from './Butterfly';
import {
  createBoidForce,
  createLiveForce,
  stepForce,
  toBoidPoint,
  type BoidForces,
  type FlockForce,
} from './forces';
import { createRay, pointerRay } from './ray';
import { pointerEngaged, stepStrength, toLocalRay, type PointerState, type Repeller } from './repeller';

/**
 * A flock of butterflies: boids from three local rules (separation,
 * alignment, cohesion), flying on the GPU, fleeing the pointer.
 *
 * **WebGPU only.** The flock is two compute passes over storage buffers in
 * which every boid reads every other boid's slot. Three's WebGL2 fallback,
 * which `WebGPURenderer` drops to when the browser has no WebGPU adapter,
 * cannot run that: on that backend nothing is drawn. A page that wants a
 * stand-in checks `renderer.backend.isWebGPUBackend` itself.
 *
 * The ready-made component. For another bird, compose `Boids` with your own
 * mesh instead (see the README).
 */

export type FlockProps = {
  /**
   * How many birds. Each one checks every other every frame (pass 1 in
   * Boids.tsx), so the cost grows with the square of this: 500 birds cost a
   * hundredth of 5,000.
   */
  count?: number;
  /** Boid units to world units. Birds start within ±250 boid units of the origin. */
  scale?: number;
  /** The group's rotation, in radians: tips boid space toward the camera. */
  tilt?: readonly [number, number, number];
  /** The palette, one colour picked per bird. */
  colours?: readonly string[];
  /** Every bird's alpha, before `fade` scales it. */
  opacity?: number;
  /** A 0..1 ref multiplied into the opacity, read every frame. Absent: 1. */
  fade?: { current: number };
  /** Whether the pointer repels the birds. False: the repeller's strength stays 0. */
  pointer?: boolean;
  /**
   * How far from the pointer's ray a bird feels it, in boid units (70 is
   * about 3.5 world units at the default scale, a seventh of the screen's
   * height with the camera 30 back).
   */
  repellerRadius?: number;
  /** How hard the ray pushes, times the eased 0..1 of whether the pointer is engaged. */
  repellerStrength?: number;
  /** A force that pulls birds in, screen-relative (`FlockForce`). Null: off. */
  attractor?: FlockForce | null;
  /** A force that pushes birds away, screen-relative. Null: off. */
  repeller?: FlockForce | null;
  /** How tightly the birds line up, 0..1. Passed to `Boids`. */
  alignment?: number;
  /** How fast they fly, 0..1. Passed to `Boids`. */
  speed?: number;
  /** Whether the birds test and write depth. Passed to `Butterfly`. */
  depthTest?: boolean;
};

/**
 * Boid space, placed in the world.
 *
 * The simulation runs in its own units (birds start within ±250 of the origin,
 * see SPACING in Boids.tsx). `scale` brings that down to world units and
 * `tilt` tips it toward the camera. Everything that lives in boid space goes
 * inside the group that applies it, so the group's inverse world matrix
 * converts a world point into it.
 */
const DEFAULT_TILT: readonly [number, number, number] = [1.2, 0, 0];
const DEFAULT_COLOURS: readonly string[] = ['#17171a'];

/** The callable forces, in a fixed order: a module constant, so a frame allocates no array. */
const KINDS = ['attractor', 'repeller'] as const;

const RESTING: PointerState = { over: false, down: false, touch: false };

export function Flock({
  count = 1000,
  scale = 0.05,
  tilt = DEFAULT_TILT,
  colours = DEFAULT_COLOURS,
  opacity = 0.075,
  fade,
  pointer = true,
  repellerRadius = 70,
  repellerStrength = 1,
  attractor = null,
  repeller = null,
  alignment = 0.5,
  speed = 0.5,
  depthTest = true,
}: FlockProps) {
  // The group that is boid space. Read by the frame callback to convert
  // world positions (the pointer's ray) into the simulation's units.
  const space = useRef<Group>(null);

  /*
   * The pointer repeller: the camera ray through the cursor, in boid space,
   * which Boids copies into its uniforms each frame. Mutated in place here,
   * never replaced, so Boids always holds the live object.
   */
  const pointerRepeller = useRef<Repeller>({ ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: -1, strength: 0 });
  // The ray in world space, rebuilt each frame from the pointer's NDC.
  const ray = useMemo(() => createRay(), []);
  // 0..1: how far the push has eased in. Times `repellerStrength`, below.
  const engaged = useRef(0);
  // world → boid space, recomputed each frame. One instance, no allocation.
  const toBoidSpace = useMemo(() => new Matrix4(), []);

  /*
   * Whether the visitor is pointing at the canvas, from pointer events on the
   * canvas element: R3F's `state.pointer` holds the last position but not
   * whether the pointer is still there. `pointerType` tells a finger from a
   * mouse or pen, which `pointerEngaged` (repeller.ts) needs: a finger counts
   * only while it is down. A ref, written by the listeners and read on the
   * frame, so pointing costs no React render.
   */
  const gl = useThree((state) => state.gl);
  const pointerState = useRef<PointerState>({ ...RESTING });
  useEffect(() => {
    const element = gl.domElement;
    const state = pointerState.current;
    const kind = (event: PointerEvent) => {
      state.touch = event.pointerType === 'touch';
    };
    const enter = (event: PointerEvent) => {
      kind(event);
      state.over = true;
    };
    const leave = (event: PointerEvent) => {
      kind(event);
      state.over = false;
    };
    const down = (event: PointerEvent) => {
      kind(event);
      state.down = true;
    };
    // A finger that starts a scroll fires `pointercancel`: that is a lift too.
    const up = (event: PointerEvent) => {
      kind(event);
      state.down = false;
    };
    element.addEventListener('pointerenter', enter);
    element.addEventListener('pointerleave', leave);
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    return () => {
      element.removeEventListener('pointerenter', enter);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      Object.assign(state, RESTING);
    };
  }, [gl]);

  /*
   * The callable attractor and repeller. The props hold what a caller asked
   * for; `live` is what is being drawn, eased toward it; `forces` is that, in
   * boid space, which Boids copies into its uniforms. All built once and
   * mutated in place. In refs, so they go with this component, and a flock
   * that mounts again fades the props' forces back in.
   */
  const live = useRef({ attractor: createLiveForce(), repeller: createLiveForce() });
  const forces = useRef<BoidForces>({ attractor: createBoidForce(), repeller: createBoidForce() });
  // The flock's centre in world space: the group's world position.
  const centre = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);

  /* eslint-disable react-hooks/immutability -- the frame loop writes the flock's centre and forces in place by design */
  useFrame((state, delta) => {
    const group = space.current;
    if (!group) return;

    /*
     * Only through a perspective camera, which is R3F's default and what
     * `pointerRay` understands. An orthographic one leaves the pointer and
     * the forces where they were.
     */
    const camera = state.camera as PerspectiveCamera;
    if (!camera.isPerspectiveCamera) return;

    group.updateWorldMatrix(true, false);
    toBoidSpace.copy(group.matrixWorld).invert();

    /*
     * The camera ray through the pointer (R3F keeps `state.pointer` as NDC,
     * y up, updated while the pointer moves over the canvas), converted into
     * the group's space; and the push eased in or out as the visitor starts
     * or stops pointing. Boids is a child, so its frame callback ran just
     * before this one: it pushes with last frame's ray, a lag of one frame
     * nobody sees.
     */
    pointerRay(ray, state.pointer.x, state.pointer.y, camera);
    const r = toLocalRay(pointerRepeller.current, ray, toBoidSpace.elements);
    engaged.current = stepStrength(engaged.current, pointer && pointerEngaged(pointerState.current), delta);
    r.strength = engaged.current * repellerStrength;

    /*
     * The callable forces: ease toward what was asked for, then convert from
     * the screen into boid space through the live camera (it may move every
     * frame) and the same matrix as the ray above. Like the ray, Boids pushes
     * with last frame's values: one frame of lag, which nobody sees.
     */
    const world = group.matrixWorld.elements;
    centre.x = world[12]!;
    centre.y = world[13]!;
    centre.z = world[14]!;
    for (const kind of KINDS) {
      const asked = kind === 'attractor' ? attractor : repeller;
      const force = stepForce(live.current[kind], asked, delta);
      toBoidPoint(forces.current[kind], force, camera, centre, toBoidSpace.elements);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={space} scale={scale} rotation={tilt as [number, number, number]}>
      <Boids
        count={count}
        repeller={pointerRepeller}
        forces={forces}
        preyRadius={repellerRadius}
        alignment={alignment}
        speed={speed}
      >
        <Butterfly colours={colours} opacity={opacity} fade={fade} depthTest={depthTest} />
      </Boids>
    </group>
  );
}
