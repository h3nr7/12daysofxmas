/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/repeller.ts` on
 * 2026-11-21, with the `Repeller` type moved in from `Boids.tsx` and
 * `pointerEngaged` rewritten over `PointerState` (DOM events on the canvas)
 * in place of h3nr7's `FramePointer`. `toLocalRay` and `stepStrength` are
 * unchanged.
 */
import { damp } from './ease';
import type { FrameRay } from './ray';

/**
 * The pointer's ray, turned into the flock's repeller.
 *
 * Two small steps, kept here so they can be tested without a GPU:
 *
 *   1. `toLocalRay`: `Flock` builds the ray in world space; the birds live
 *      in boid space (Flock's group: scaled by 0.05 and tilted). Convert it.
 *   2. `stepStrength`: ease the push in while the pointer is over the canvas
 *      and out when it leaves, so the flock relaxes rather than snapping back.
 *
 * Nothing here imports three: the matrix is taken as its 16 numbers.
 */

/**
 * A line the birds flee, in boid space: an origin, a unit direction, and how
 * hard it pushes (0 = off, 1 = as hard as an attractor of strength 1).
 *
 * The flock uses it for the camera ray through the pointer, so every bird
 * flees the nearest point on the line through the cursor, whatever its depth.
 */
export type Repeller = {
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
  strength: number;
};

/**
 * What `Flock` knows of the pointer, kept from pointer events on the canvas
 * element (`pointerenter`, `pointerleave`, `pointerdown`, `pointerup`,
 * `pointercancel`).
 */
export type PointerState = {
  /** Whether the pointer is over the canvas. */
  over: boolean;
  /** Whether a button, pen or finger is down. */
  down: boolean;
  /** Whether the last event came from a finger (`pointerType === 'touch'`). */
  touch: boolean;
};

/**
 * Whether the visitor is pointing at the flock right now.
 *
 *   - With a mouse, trackpad or pen: while it hovers over the canvas.
 *   - With a finger: while it is down. Touch has no hover, so `over` on its
 *     own means nothing there.
 */
export function pointerEngaged(state: PointerState): boolean {
  return state.touch ? state.down : state.over;
}

/** How fast the push eases in and out, roughly per second. ~8: about a third of a second. */
export const FADE_RATE = 8;

/**
 * Write `ray`, converted by `inverse`, into `out`'s origin and direction.
 *
 * `inverse` is the inverse of boid space's world matrix (three's `Matrix4`
 * `.elements`, column-major), i.e. world → boid space.
 *   - The origin is a point: multiply by the full matrix, translation included.
 *   - The direction is a direction: rotate and scale only (no translation),
 *     then normalise, because the 0.05 scale makes it 20 units long in boid
 *     space and the shader's nearest-point maths wants a unit vector.
 * `out.strength` is left alone.
 */
export function toLocalRay(out: Repeller, ray: FrameRay, inverse: ArrayLike<number>): Repeller {
  const e = inverse;
  const { ox, oy, oz, dx, dy, dz } = ray;

  out.ox = e[0]! * ox + e[4]! * oy + e[8]! * oz + e[12]!;
  out.oy = e[1]! * ox + e[5]! * oy + e[9]! * oz + e[13]!;
  out.oz = e[2]! * ox + e[6]! * oy + e[10]! * oz + e[14]!;

  const x = e[0]! * dx + e[4]! * dy + e[8]! * dz;
  const y = e[1]! * dx + e[5]! * dy + e[9]! * dz;
  const z = e[2]! * dx + e[6]! * dy + e[10]! * dz;
  const length = Math.hypot(x, y, z) || 1;
  out.dx = x / length;
  out.dy = y / length;
  out.dz = z / length;
  return out;
}

/**
 * The repeller's strength next frame: toward 1 while engaged
 * (`pointerEngaged`), toward 0 when not. Frame-rate independent (`damp`).
 */
export function stepStrength(current: number, engaged: boolean, delta: number, rate = FADE_RATE): number {
  return damp(current, engaged ? 1 : 0, rate, delta);
}
