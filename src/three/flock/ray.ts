/*
 * Taken from h3nr7 `packages/canvas/src/lib/ray.ts` on 2026-11-21. Unchanged
 * but for this header and the note below on who computes it.
 */

/**
 * The camera ray through the pointer, in world space.
 *
 * A visual that wants to react to the cursor in 3D needs more than the
 * pointer's NDC: a point on screen is a whole line through the scene. This is
 * that line, the same one three's `Raycaster.setFromCamera` builds. `Flock`
 * computes it once a frame from R3F's `state.pointer` and `state.camera`, so
 * the repeller and the forces read the same numbers.
 *
 * **Nothing in this module imports three.** The camera is taken structurally,
 * so a `PerspectiveCamera` fits as it is and a spec can pass a plain object.
 * No allocation either: the result is written into the object passed in.
 */

/** A ray: an origin and a unit direction, both world space. */
export type FrameRay = {
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
};

/** The parts of a perspective camera the ray needs. */
export type RayCamera = {
  /** Vertical field of view, in degrees, as three stores it. */
  fov: number;
  aspect: number;
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
};

const DEG2RAD = Math.PI / 180;

/** A ray from the origin straight down -z: what a camera at rest looks along. */
export function createRay(): FrameRay {
  return { ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: -1 };
}

/**
 * Write the ray through NDC point (`nx`, `ny`) into `out`.
 *
 * How it works, in camera space first:
 *   - The camera looks down -z. At distance 1 in front of it, the visible
 *     half-height is `tan(fov / 2)` and the half-width is that times aspect.
 *   - So NDC (nx, ny) sits at (nx·halfW, ny·halfH, -1). That point, from the
 *     camera at the origin, IS the direction. Normalise it.
 *   - Rotate it by the camera's quaternion into world space. The origin is
 *     simply the camera's position.
 *
 * NDC (0, 0) therefore gives the camera's forward axis, and the edges of the
 * screen give directions `fov / 2` off it.
 */
export function pointerRay(out: FrameRay, nx: number, ny: number, camera: RayCamera): FrameRay {
  const halfH = Math.tan((camera.fov * DEG2RAD) / 2);
  const halfW = halfH * camera.aspect;

  // Camera-space direction, normalised. Never zero: z is always -1.
  let x = nx * halfW;
  let y = ny * halfH;
  let z = -1;
  const len = Math.hypot(x, y, z);
  x /= len;
  y /= len;
  z /= len;

  // Rotate by the quaternion q = (qx, qy, qz, qw):
  //   t  = 2 · (q.xyz × v)
  //   v' = v + qw · t + q.xyz × t
  // the standard expansion of q · v · q⁻¹ without building a matrix.
  const { x: qx, y: qy, z: qz, w: qw } = camera.quaternion;
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  out.dx = x + qw * tx + (qy * tz - qz * ty);
  out.dy = y + qw * ty + (qz * tx - qx * tz);
  out.dz = z + qw * tz + (qx * ty - qy * tx);

  out.ox = camera.position.x;
  out.oy = camera.position.y;
  out.oz = camera.position.z;
  return out;
}
