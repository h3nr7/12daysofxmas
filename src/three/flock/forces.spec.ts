/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/forces.spec.ts` on
 * 2026-11-21. Unchanged but for the import paths: `FLOCK_FORCE_DEFAULTS` and
 * `FlockForce` now live in `./forces`.
 */
import { describe, expect, it } from 'vitest';
/*
 * three's core, in a spec only: the checks below compare `toBoidPoint` with
 * three's own transforms and projection, so they test the maths against an
 * independent implementation rather than against a copy of itself. Nothing
 * outside specs here imports `three` (the stage uses `three/webgpu`).
 */
import { Group, PerspectiveCamera, Vector3 } from 'three/webgpu';
import {
  DEPTH_RANGE,
  FLOCK_FORCE_DEFAULTS,
  type FlockForce,
  createBoidForce,
  createLiveForce,
  stepForce,
  toBoidPoint,
  type LiveForce,
} from './forces';

const FRAME = 1 / 60;
const TAN_HALF_FOV = Math.tan((22.5 * Math.PI) / 180);

/** The flock's camera: 30 back, fov 45, looking at the origin. */
function flockCamera(aspect = 16 / 9, z = 30) {
  const camera = new PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 0, z);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
}

/** Flock's boid-space group, with its real transform (Flock.tsx: BOID_SCALE, BOID_TILT). */
function boidSpace() {
  const group = new Group();
  group.scale.setScalar(0.05);
  group.rotation.set(1.2, 0, 0);
  group.updateMatrixWorld();
  const inverse = group.matrixWorld.clone().invert();
  return { group, inverse: inverse.elements };
}

const ORIGIN = { x: 0, y: 0, z: 0 };

function live(over: Partial<LiveForce> = {}): LiveForce {
  return { ...createLiveForce(), ...FLOCK_FORCE_DEFAULTS, fade: 1, settled: true, ...over };
}

/** A boid-space result, back in world space through the group. */
function toWorld(group: Group, p: { x: number; y: number; z: number }) {
  return group.localToWorld(new Vector3(p.x, p.y, p.z));
}

describe('toBoidPoint', () => {
  it('puts the centre of the screen at depth 0 on the flock’s origin', () => {
    const { inverse } = boidSpace();
    const out = toBoidPoint(createBoidForce(), live({ x: 0, y: 0, depth: 0 }), flockCamera(), ORIGIN, inverse);
    expect(out.x).toBeCloseTo(0, 6);
    expect(out.y).toBeCloseTo(0, 6);
    expect(out.z).toBeCloseTo(0, 6);
  });

  it('puts x = 1 at depth 0 on the right edge of the view, in the centre plane', () => {
    const aspect = 16 / 9;
    const { group, inverse } = boidSpace();
    const out = toBoidPoint(createBoidForce(), live({ x: 1, y: 0 }), flockCamera(aspect), ORIGIN, inverse);
    const world = toWorld(group, out);
    expect(world.x).toBeCloseTo(TAN_HALF_FOV * 30 * aspect, 4);
    expect(world.y).toBeCloseTo(0, 4);
    expect(world.z).toBeCloseTo(0, 4);
  });

  it('lands under the screen position asked for, as three projects it', () => {
    const camera = flockCamera();
    const { group, inverse } = boidSpace();
    const out = toBoidPoint(createBoidForce(), live({ x: -0.6, y: 0.4, depth: 0.3 }), camera, ORIGIN, inverse);
    const ndc = toWorld(group, out).project(camera);
    expect(ndc.x).toBeCloseTo(-0.6, 5);
    expect(ndc.y).toBeCloseTo(0.4, 5);
  });

  it('moves along the view with depth, without sliding across the screen', () => {
    const camera = flockCamera();
    const { group, inverse } = boidSpace();
    const near = toWorld(group, toBoidPoint(createBoidForce(), live({ x: 0.5, y: -0.5, depth: -1 }), camera, ORIGIN, inverse));
    const far = toWorld(group, toBoidPoint(createBoidForce(), live({ x: 0.5, y: -0.5, depth: 1 }), camera, ORIGIN, inverse));

    // The same spot on screen...
    const a = near.clone().project(camera);
    const b = far.clone().project(camera);
    expect(a.x).toBeCloseTo(b.x, 5);
    expect(a.y).toBeCloseTo(b.y, 5);
    // ...on planes DEPTH_RANGE either side of the centre, facing the camera.
    expect(near.z).toBeCloseTo(DEPTH_RANGE, 4);
    expect(far.z).toBeCloseTo(-DEPTH_RANGE, 4);
  });

  it('measures depth from the flock’s centre, wherever the group sits', () => {
    const camera = flockCamera();
    const group = new Group();
    group.position.set(0, 0, -10);
    group.scale.setScalar(0.05);
    group.rotation.set(1.2, 0, 0);
    group.updateMatrixWorld();
    const inverse = group.matrixWorld.clone().invert().elements;
    const out = toBoidPoint(createBoidForce(), live({ x: 0, y: 0, depth: 0 }), camera, group.position, inverse);
    expect(Math.hypot(out.x, out.y, out.z)).toBeCloseTo(0, 5);
  });

  it('converts radius 0.3 to boid units: three tenths of the half-height at the centre, at scale 20', () => {
    const { inverse } = boidSpace();
    const out = toBoidPoint(createBoidForce(), live({ radius: 0.3 }), flockCamera(), ORIGIN, inverse);
    expect(out.radius).toBeCloseTo(0.3 * TAN_HALF_FOV * 30 * 20, 4);
    // About the pointer repeller's 70.
    expect(out.radius).toBeGreaterThan(70);
    expect(out.radius).toBeLessThan(80);
  });

  it('keeps the radius whatever the depth', () => {
    const { inverse } = boidSpace();
    const camera = flockCamera();
    const near = toBoidPoint(createBoidForce(), live({ depth: -1 }), camera, ORIGIN, inverse);
    const far = toBoidPoint(createBoidForce(), live({ depth: 1 }), camera, ORIGIN, inverse);
    expect(near.radius).toBeCloseTo(far.radius, 6);
  });

  it('never puts the point behind the camera, even from inside the flock', () => {
    // 5 units from the centre, so depth -1 would be 7.5 behind the lens.
    const camera = flockCamera(16 / 9, 5);
    const { group, inverse } = boidSpace();
    const out = toBoidPoint(createBoidForce(), live({ x: 0.2, depth: -1 }), camera, ORIGIN, inverse);
    const world = toWorld(group, out);
    const forwardDistance = world.clone().sub(camera.position).dot(camera.getWorldDirection(new Vector3()));
    expect(forwardDistance).toBeGreaterThan(0);
    expect(Number.isFinite(out.radius) && out.radius > 0).toBe(true);
  });

  it('feeds the shader the strength times the fade', () => {
    const { inverse } = boidSpace();
    const out = toBoidPoint(createBoidForce(), live({ strength: 2, fade: 0.25 }), flockCamera(), ORIGIN, inverse);
    expect(out.strength).toBeCloseTo(0.5);
  });

  it('writes into the object it is given', () => {
    const out = createBoidForce();
    expect(toBoidPoint(out, live(), flockCamera(), ORIGIN, boidSpace().inverse)).toBe(out);
  });
});

describe('stepForce', () => {
  const target = (over: Partial<FlockForce> = {}): FlockForce => ({ ...FLOCK_FORCE_DEFAULTS, ...over });

  it('appears in place the first time: copies the fields, and only fades in', () => {
    const force = stepForce(createLiveForce(), target({ x: 0.8, y: -0.4, depth: 0.5, strength: 2, radius: 0.1 }), FRAME);
    expect(force).toMatchObject({ x: 0.8, y: -0.4, depth: 0.5, strength: 2, radius: 0.1, settled: true });
    expect(force.fade).toBeGreaterThan(0);
    expect(force.fade).toBeLessThan(1);
  });

  it('eases a later move rather than jumping', () => {
    const force = stepForce(createLiveForce(), target({ x: 0 }), FRAME);
    stepForce(force, target({ x: 1 }), FRAME);
    expect(force.x).toBeGreaterThan(0);
    expect(force.x).toBeLessThan(1);
  });

  it('arrives within a second', () => {
    const force = stepForce(createLiveForce(), target({ x: 0 }), FRAME);
    for (let i = 0; i < 60; i++) stepForce(force, target({ x: 1, strength: 3 }), FRAME);
    expect(force.x).toBeGreaterThan(0.99);
    expect(force.strength).toBeGreaterThan(2.97);
    expect(force.fade).toBeGreaterThan(0.99);
  });

  it('fades out in place when cleared', () => {
    const force = stepForce(createLiveForce(), target({ x: 0.7 }), FRAME);
    for (let i = 0; i < 30; i++) stepForce(force, target({ x: 0.7 }), FRAME);
    const before = force.fade;
    stepForce(force, null, FRAME);
    expect(force.fade).toBeLessThan(before);
    expect(force.x).toBe(0.7);
  });

  it('is gone, and unsettled, a second after a clear', () => {
    const force = stepForce(createLiveForce(), target(), FRAME);
    for (let i = 0; i < 60; i++) stepForce(force, null, FRAME);
    expect(force.fade).toBe(0);
    expect(force.settled).toBe(false);
  });

  it('appears in place again after a full fade-out', () => {
    const force = stepForce(createLiveForce(), target({ x: -0.9 }), FRAME);
    for (let i = 0; i < 60; i++) stepForce(force, null, FRAME);
    stepForce(force, target({ x: 0.9 }), FRAME);
    expect(force.x).toBe(0.9);
  });

  it('eases back from where a fade had got to when set again mid-fade', () => {
    const force = stepForce(createLiveForce(), target({ x: 0 }), FRAME);
    for (let i = 0; i < 30; i++) stepForce(force, target({ x: 0 }), FRAME);
    for (let i = 0; i < 5; i++) stepForce(force, null, FRAME);
    const fading = force.fade;
    stepForce(force, target({ x: 1 }), FRAME);
    expect(force.fade).toBeGreaterThan(fading);
    expect(force.x).toBeGreaterThan(0);
    expect(force.x).toBeLessThan(1);
  });

  it('does not depend on the frame rate', () => {
    const once = stepForce(stepForce(createLiveForce(), target({ x: 0 }), FRAME), target({ x: 1 }), 1 / 30);
    const twice = stepForce(
      stepForce(stepForce(createLiveForce(), target({ x: 0 }), FRAME), target({ x: 1 }), 1 / 60),
      target({ x: 1 }),
      1 / 60,
    );
    expect(twice.x).toBeCloseTo(once.x, 10);
  });

  it('stays at zero when never set', () => {
    const force = stepForce(createLiveForce(), null, FRAME);
    expect(force).toMatchObject({ fade: 0, settled: false });
  });
});
