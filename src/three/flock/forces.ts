/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/forces.ts` on
 * 2026-11-21, with `FlockForceKind`, `FlockForce`, `FLOCK_FORCE_LIMITS` and
 * `FLOCK_FORCE_DEFAULTS` moved in from `packages/canvas/src/lib/flock-forces.ts`.
 * The store that held them is not here: `Flock` takes the forces as props.
 * `stepForce` and `toBoidPoint` are unchanged.
 */
import { damp } from './ease';
import { createRay, pointerRay, type RayCamera } from './ray';
import { FADE_RATE } from './repeller';

/**
 * The flock's two callable forces, one attractor and one repeller, placed by
 * code rather than by the pointer, and the steps from what a caller asked for
 * to what the shader is fed.
 *
 * A caller describes a force (`FlockForce`) and hands it to `Flock` as a prop;
 * the flock does everything else: easing, the screen-to-boid conversion, the
 * shader. So a caller holds **targets only**, and can set a value once and
 * walk away.
 *
 * Two steps, kept here so they can be tested without a GPU, as `repeller.ts`
 * does for the pointer:
 *
 *   1. `stepForce`: ease the live force toward the caller's target, and fade
 *      it in when set and out when cleared.
 *   2. `toBoidPoint`: turn the screen-relative force into a point and a
 *      radius in boid space (Flock's group: scaled by 0.05 and tilted).
 *
 * Nothing here imports three: the camera is taken structurally and the
 * matrix as its 16 numbers.
 */

/** One of each, and no ids: `kind` is the id. */
export type FlockForceKind = 'attractor' | 'repeller';

/**
 * One force, as a caller describes it. All screen-relative, so a caller needs
 * to know nothing about the camera, the boid units or the flock's tilt.
 */
export type FlockForce = {
  /** Across the viewport: -1 the left edge, 1 the right. */
  x: number;
  /** Up the viewport: -1 the bottom edge, 1 the top. Y up, as NDC. */
  y: number;
  /**
   * Through the flock: -1 its near side, 0 the plane through its centre facing
   * the camera, 1 its far side.
   */
  depth: number;
  /** How hard. Always positive: the kind says which way. */
  strength: number;
  /**
   * How far it reaches, in the units of `y` at depth 0: 0.3 is three tenths of
   * the way from the centre of the screen to its top edge.
   */
  radius: number;
};

/**
 * The range each field makes sense in. Nothing here clamps to it: a caller
 * that takes forces from outside (a model, a form) should.
 *
 * `strength` stops at 3: past that the push throws birds clean out of the
 * frame. `radius` stops above 0 because the shader divides by its square.
 */
export const FLOCK_FORCE_LIMITS: Readonly<Record<keyof FlockForce, readonly [number, number]>> = {
  x: [-1, 1],
  y: [-1, 1],
  depth: [-1, 1],
  strength: [0, 3],
  radius: [0.02, 1],
};

/**
 * A whole force for a caller that only wants to say where: centre of the
 * screen, at the flock's middle. Strength 2 and radius 0.5, which is half the
 * way from the centre to the top edge.
 *
 * These were strength 1 and radius 0.3, sized to match the pointer repeller
 * (about 70 boid units, Flock.tsx). That read as the same size of thing, but
 * too subtle for a force someone has just asked for: the flock barely bent.
 * A force placed by asking should be obvious at a glance. Strength stays
 * below the limit of 3, where birds are thrown out of the frame.
 */
export const FLOCK_FORCE_DEFAULTS: Readonly<FlockForce> = {
  x: 0,
  y: 0,
  depth: 0,
  strength: 2,
  radius: 0.5,
};

/**
 * One force as the flock is drawing it right now: the caller's fields, eased,
 * plus how far it has faded in (`fade`, 0..1) and whether it has a position yet
 * (`settled`).
 */
export type LiveForce = FlockForce & { fade: number; settled: boolean };

/** One force as Boids takes it: a point and a radius in boid units, and a strength. */
export type BoidForce = { x: number; y: number; z: number; strength: number; radius: number };

export type BoidForces = Record<FlockForceKind, BoidForce>;

/**
 * How far `depth` reaches, in world units either side of the flock's centre,
 * so that depth -1 is about the flock's near side and 1 its far side.
 *
 * Not the ±12.5 the birds START in (±250 boid units, SPACING in Boids.tsx, at
 * the 0.05 scale). The flying flock is much thinner in depth than that: the
 * pull to the centre is 2.5 times stronger along boid y (Boids.tsx), and the
 * group's 1.2 rad tilt turns most of boid y into depth. Measured by eye at
 * 12.5: an attractor at depth 1 caught no birds at all, and at 0.5 (6.25
 * units) only the edge of the flock. Hence 6.
 */
export const DEPTH_RANGE = 6;

/**
 * The nearest a force may come to the camera, in world units along its view.
 * Only reached when the camera is inside or close to the flock; keeps the
 * point in front of the lens and the radius above zero.
 */
export const MIN_DISTANCE = 1;

/** Below this a fading force counts as gone, and its next `set` appears in place. */
const GONE = 0.001;

const FIELDS = ['x', 'y', 'depth', 'strength', 'radius'] as const;

export function createLiveForce(): LiveForce {
  return { x: 0, y: 0, depth: 0, strength: 0, radius: 0, fade: 0, settled: false };
}

export function createBoidForce(): BoidForce {
  return { x: 0, y: 0, z: 0, strength: 0, radius: 1 };
}

/**
 * Step `live` one frame toward `target` (`null`: cleared). Mutates and
 * returns `live`. Frame-rate independent, through `damp`, at the pointer
 * repeller's rate, so the two forces and the pointer all ease alike.
 *
 *   - **Set:** every field eases toward the target, and `fade` toward 1.
 *   - **Set, first time:** the fields are copied, not eased; only `fade`
 *     eases. Otherwise a new force would sweep in from wherever the last one
 *     was, or from the centre.
 *   - **Cleared:** the fields hold where they are and `fade` falls toward 0,
 *     so the force fades out in place. Once it is gone it is unsettled again,
 *     so the next `set` also appears in place.
 *   - **Set while fading out:** still settled, so it eases from where the fade
 *     had got to, toward the new target. No jump.
 */
export function stepForce(
  live: LiveForce,
  target: Readonly<FlockForce> | null,
  delta: number,
  rate = FADE_RATE,
): LiveForce {
  if (target) {
    if (live.settled) {
      for (const field of FIELDS) live[field] = damp(live[field], target[field], rate, delta);
    } else {
      for (const field of FIELDS) live[field] = target[field];
      live.settled = true;
    }
    live.fade = damp(live.fade, 1, rate, delta);
  } else {
    live.fade = damp(live.fade, 0, rate, delta);
    if (live.fade < GONE) {
      live.fade = 0;
      live.settled = false;
    }
  }
  return live;
}

const DEG2RAD = Math.PI / 180;

/*
 * Scratch rays, reused every call so a frame allocates nothing. That makes
 * `toBoidPoint` non-reentrant, which costs nothing: it never calls itself and
 * nothing else runs between its first and last line.
 */
const ray = createRay();
const forward = createRay();

/**
 * Write `live`, converted into boid space, into `out`. Returns `out`.
 *
 * `camera` is the live camera (it moves every frame). `centre` is the flock's
 * centre in world space: the group's world position. `inverse` is the inverse
 * of the group's world matrix (three's `Matrix4.elements`, column-major), i.e.
 * world → boid space, the same one Flock builds for the pointer's ray.
 *
 * The point:
 *   1. The camera ray through (x, y), from `pointerRay`, the same function
 *      `Flock` uses for the cursor: the force sits somewhere on that line, so
 *      it is always under the screen position asked for.
 *   2. How far along it. `d0` is the distance from the camera to the plane
 *      through the flock's centre facing the camera, measured along the
 *      camera's forward axis. Depth moves that plane by `DEPTH_RANGE` per unit.
 *      The ray reaches the plane at `along / cos`, where `cos` is the angle
 *      between the ray and the forward axis; dividing by it keeps the point on
 *      a flat plane, so changing depth never slides it across the screen.
 *      `cos` is positive: `x` and `y` are within the screen, so within the fov.
 *   3. Through `inverse` into boid space.
 *
 * The radius: `radius` is a fraction of the screen's half-height at the
 * centre plane, so in world units it is `radius × tan(fov / 2) × d0`; times
 * the inverse matrix's scale (the length of its first column: 20 for the
 * flock's 0.05) it is boid units. Measured at depth 0 whatever the depth, so
 * a force keeps its size in the flock as it moves through it. Assumes boid
 * space is scaled the same on every axis, as the flock's group is.
 *
 * The strength is the caller's, times how far it has faded in.
 */
export function toBoidPoint(
  out: BoidForce,
  live: Readonly<LiveForce>,
  camera: RayCamera,
  centre: { x: number; y: number; z: number },
  inverse: ArrayLike<number>,
): BoidForce {
  pointerRay(ray, live.x, live.y, camera);
  pointerRay(forward, 0, 0, camera);

  const d0 =
    (centre.x - ray.ox) * forward.dx + (centre.y - ray.oy) * forward.dy + (centre.z - ray.oz) * forward.dz;
  const along = Math.max(d0 + live.depth * DEPTH_RANGE, MIN_DISTANCE);
  const cos = ray.dx * forward.dx + ray.dy * forward.dy + ray.dz * forward.dz;
  const t = along / cos;

  const px = ray.ox + ray.dx * t;
  const py = ray.oy + ray.dy * t;
  const pz = ray.oz + ray.dz * t;

  const e = inverse;
  out.x = e[0]! * px + e[4]! * py + e[8]! * pz + e[12]!;
  out.y = e[1]! * px + e[5]! * py + e[9]! * pz + e[13]!;
  out.z = e[2]! * px + e[6]! * py + e[10]! * pz + e[14]!;

  const scale = Math.hypot(e[0]!, e[1]!, e[2]!);
  const halfHeight = Math.tan((camera.fov * DEG2RAD) / 2);
  out.radius = live.radius * halfHeight * Math.max(d0, MIN_DISTANCE) * scale;

  out.strength = live.strength * live.fade;
  return out;
}
