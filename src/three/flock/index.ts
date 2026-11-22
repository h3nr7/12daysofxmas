/*
 * The flock reference's front door. Everything a project may want is named
 * here, so a copy can be imported as one module (`./flock`).
 */
export { Flock, type FlockProps } from './Flock';
export { Boids, useBoids, alignmentWeight, speedScale, type BoidsProps, type BoidsCtx } from './Boids';
export { Butterfly, type ButterflyProps } from './Butterfly';
export { createRay, pointerRay, type FrameRay, type RayCamera } from './ray';
export { damp } from './ease';
export {
  DEPTH_RANGE,
  FLOCK_FORCE_DEFAULTS,
  FLOCK_FORCE_LIMITS,
  MIN_DISTANCE,
  createBoidForce,
  createLiveForce,
  stepForce,
  toBoidPoint,
  type BoidForce,
  type BoidForces,
  type FlockForce,
  type FlockForceKind,
  type LiveForce,
} from './forces';
export {
  FADE_RATE,
  pointerEngaged,
  stepStrength,
  toLocalRay,
  type PointerState,
  type Repeller,
} from './repeller';
