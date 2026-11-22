/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/Boids.tsx` on
 * 2026-11-21. Changed only where the reference stands alone: the alignment
 * and speed controls are props (`alignment`, `speed`) in place of the
 * `lib/flock-controls` store, with `alignmentWeight` and `speedScale` moved
 * in from it; the `Repeller` type lives in `repeller.ts`.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import * as THREE from 'three/webgpu';
import { Continue, cos, deltaTime, float, Fn, If, instancedArray, instanceIndex, Loop, max, PI2, uniform, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";
import type { BoidForces } from "./forces";
import type { Repeller } from "./repeller";

export type { Repeller } from "./repeller";

/**
 * The canvas's renderer. R3F types `state.gl` as `WebGLRenderer`, but a
 * WebGPU canvas (the `webgpu-canvas` reference) always hands it a
 * `WebGPURenderer`; the two share no ancestor, so the assertion goes through
 * `unknown`. Kept inline so the flock imports nothing outside its folder.
 */
function useWebGPURenderer(): THREE.WebGPURenderer {
  return useThree((state) => state.gl as unknown as THREE.WebGPURenderer);
}

/** Gap between neighbouring birds, in the geometry's local units. */
const SPACING = 500;
const SPEED_LIMIT = 9.0;
/*
 * How strongly a bird takes on the heading of the birds in its alignment band,
 * and how far a frame's velocity moves it, were the constants ALIGNMENT (2) and
 * SPEED_SCALE (15). They are now the `alignment` and `speed` props, 0..1 with
 * 0.5 mapping back to exactly those values (`alignmentWeight`, `speedScale`
 * below), read into uniforms each frame. 1 alignment is three's example; the
 * pull to the centre (5 steps a frame) is what it competes with.
 */

/**
 * The alignment weight in the velocity pass: 0 to 4, linear, so 0.5 is 2,
 * the `ALIGNMENT` constant it replaced. Higher and the flock lines up sooner;
 * at 4 it moves almost as one sheet, still loosened by the pull to the centre.
 */
export function alignmentWeight(alignment: number): number {
  return alignment * 4;
}

/**
 * The position step's scale: 6 to 24, linear, so 0.5 is 15, the
 * `SPEED_SCALE` constant it replaced: 0.4x to 1.6x the flock's speed.
 * `SPEED_LIMIT` (the cap on a bird's velocity) is unchanged, so this moves
 * the whole flock faster or slower without changing how it steers.
 */
export function speedScale(speed: number): number {
  return 6 + speed * 18;
}

/**
 * How long, in seconds, the flock takes to settle most of the way (63%) to a
 * new alignment or speed. A control set by a click should read as the flock
 * changing its mind, not a jump cut.
 */
const CONTROL_EASE_SECONDS = 0.6;

/**
 * The longest step one frame may simulate, in seconds.
 *
 * TSL's `deltaTime` is the real time since the last frame, uncapped. While the
 * tab or window is in the background the browser stops or throttles frames, so
 * the first frame back can be many seconds long, and one step that size throws
 * every boid far off screen. Capped, a long gap is simply a pause.
 */
const MAX_STEP = 1 / 30;
const step = deltaTime.min(MAX_STEP);

/**
 * A seeded random number generator (mulberry32): the same seed gives the same
 * sequence of numbers in [0, 1). Stands in for `Math.random()` inside
 * `useMemo`, which render must not call (react-hooks/purity): the flock is
 * scattered just as randomly, but the same `count` scatters it the same way.
 */
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BoidsProps {
  /**
   * Read every frame and copied into uniforms before the compute passes. A
   * ref, so moving it costs no React render. Omitted: no repeller.
   */
  repeller?: { current: Repeller }
  /**
   * The callable attractor and repeller (`forces.ts`), already in boid space:
   * Flock eases and converts them. Read every frame into uniforms, like
   * `repeller`, so moving one costs no React render and no shader rebuild. A
   * strength of 0 switches one off. Omitted: both off.
   */
  forces?: { current: BoidForces }
  /** How tightly the birds take on their neighbours' heading: 0 loose, 1 in lock-step. */
  alignment?: number
  /** How fast they fly: 0 slow, 1 fast. */
  speed?: number
  count?: number
  separationDistance?: number
  alignmentDistance?: number
  cohesionDistance?: number
  preyRadius?: number
  flapMeanFrequency?: number
  attractors?: THREE.Vector4[]
  centralAttractor?: THREE.Vector3
}

export interface BoidsCtx {
  count: number
  positionBuffer?: THREE.StorageBufferNode<'vec3'>
  velocityBuffer?: THREE.StorageBufferNode<'vec3'>
  velocityNextBuffer?: THREE.StorageBufferNode<'vec3'>
  phaseBuffer?: THREE.StorageBufferNode<'float'>
}

/**
 * Boids Context
 */
const BoidsCtx = createContext<BoidsCtx>({ count: 0 });

/**
 * Boids context hook
 * @returns
 */
export const useBoids = () => useContext(BoidsCtx)


const DEFAULT_CENTRAL = new THREE.Vector3(0, 0, 0);
const DEFAULT_ATTRACTORS = [
  new THREE.Vector4(0, 30, 0, 5),
  // new THREE.Vector4(20, 20, 0, -5),
];

export function Boids({
  repeller,
  forces,
  alignment = 0.5,
  speed = 0.5,
  centralAttractor = DEFAULT_CENTRAL,
  attractors = DEFAULT_ATTRACTORS,
  count = 15000,
  separationDistance = 10.0,
  alignmentDistance = 10.0,
  cohesionDistance = 10.0,
  preyRadius = 50.0,
  flapMeanFrequency = 40,
  children
}: PropsWithChildren<BoidsProps>) {
  const renderer = useWebGPURenderer();

  // attractor buffer
  const [
    attractorBuffer,
    attractorCount
  ] = useMemo(() => {
    const initialAttractors = new Float32Array(attractors.length * 4);

    attractors.forEach((v, i) => {
      const i4 = i * 4;
      initialAttractors[i4] = v.x;
      initialAttractors[i4 + 1] = v.y;
      initialAttractors[i4 + 2] = v.z;
      initialAttractors[i4 + 3] = v.w;
    });

    return [
      instancedArray(initialAttractors, 'vec4'),
      attractors.length
    ] as const
  }, [attractors]);

  // this is a single uniform, DO NOT need to be a storage buffer
  const central = useMemo(() => uniform(new THREE.Vector3()), []);

  // The repeller line, as uniforms: written from the `repeller` ref each
  // frame (see useFrame below), so the shader is never rebuilt for it.
  const { uRayOrigin, uRayDir, uRayStrength } = useMemo(() => ({
    uRayOrigin: uniform(new THREE.Vector3()),
    uRayDir: uniform(new THREE.Vector3(0, 0, -1)),
    uRayStrength: uniform(0),
  }), []);

  // The controls, in the shader's terms, eased towards the props each frame
  // (see useFrame below). Built once, from the first render's props, so the
  // first frame is the flock as asked for; later changes ease in.
  const [{ uAlignment, uSpeedScale }] = useState(() => ({
    uAlignment: uniform(alignmentWeight(alignment)),
    uSpeedScale: uniform(speedScale(speed)),
  }));

  // The callable forces, as uniforms: position in xyz, strength in w, and a
  // radius each. Plain uniforms rather than an array: there are exactly two,
  // and each is named. Written from the `forces` ref each frame.
  const { uAttract, uAttractRadius, uRepel, uRepelRadius } = useMemo(() => ({
    uAttract: uniform(new THREE.Vector4()),
    uAttractRadius: uniform(1),
    uRepel: uniform(new THREE.Vector4()),
    uRepelRadius: uniform(1),
  }), []);
  // initiate central
  useEffect(() => {
    central.value.copy(centralAttractor);
  }, [central, centralAttractor]);

  // all the rules memo
  const { separationThresh, alignmentThresh, zoneRadiusSq } = useMemo(() => {
    const zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
    return {
      separationThresh: separationDistance / zoneRadius,
      alignmentThresh: (separationDistance + alignmentDistance) / zoneRadius,
      zoneRadiusSq: zoneRadius * zoneRadius,
    };
  }, [separationDistance, alignmentDistance, cohesionDistance]);

  // boid buffers
  const [
    positionBuffer,
    velocityBuffer,
    velocityNextBuffer,
    phaseBuffer
  ] = useMemo(() => {
    // initla vars
    const initialPositions = new Float32Array(count * 3);
    const initialVelocities = new Float32Array(count * 3);
    const initialPhases = new Float32Array(count);
    // Math.random(), seeded (see seededRandom)
    const random = seededRandom(count);

    // initial values
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // position
      initialPositions[i3]      = (random() - 0.5) * SPACING;
      initialPositions[i3 + 1]  = (random() - 0.5) * SPACING;
      initialPositions[i3 + 2]  = (random() - 0.5) * SPACING;
      // velocity
      initialVelocities[i3]     = (random() - 0.5) * 2
      initialVelocities[i3 + 1] = (random() - 0.5) * 1
      initialVelocities[i3 + 2] = (random() - 0.5) * 2
      // phase
      initialPhases[i] = random() * flapMeanFrequency * Math.PI * 2;
    }

    // clone the velocity buffer to initialise
    const initialVelocitiesNext = new Float32Array(initialVelocities);

    return [
      instancedArray(initialPositions, 'vec3'),
      instancedArray(initialVelocities, 'vec3'),
      instancedArray(initialVelocitiesNext, 'vec3'),
      instancedArray(initialPhases, 'float')
    ] as const;
  }, [count, flapMeanFrequency]);


  /*
   * Two passes, so reading shared data and writing it never happen in the same
   * one. Within a pass every boid runs at once, in no fixed order: a pass that
   * read its neighbours AND wrote its own velocity and position would see some
   * neighbours' old values and some new, differently every frame.
   *
   *   Pass 1, velocity (decide): reads every boid's position and velocity and
   *   the attractors; writes only its own slot of velocityNextBuffer, which
   *   nothing reads during this pass.
   *   Pass 2, position (commit): reads its own slot of velocityNextBuffer;
   *   writes its own velocity, phase and position.
   *
   * So during pass 1, positionBuffer and velocityBuffer are never written and
   * every neighbour read is last frame's value. The material reads only
   * position, velocity and phase, which hold committed values between frames.
   */

  // Pass 1: decide each boid's new velocity from everyone's current state.
  const velocityComputePass = useMemo(() => {
    return Fn(() => {
      const pos = positionBuffer.element(instanceIndex);
      // read-only in this pass: neighbours read velocityBuffer too
      const velStore = velocityBuffer.element(instanceIndex);

      const vel = velStore.toVar();

      const limit = float(SPEED_LIMIT).toVar();

      /*
       * The predator rule, shared by the attractors, the repeller line and
       * the callable forces.
       *
       * Inside `radius` of `target`, push the bird along (target - pos)
       * by (dist² / radius² - 1), which is -1 at the target and 0 at the
       * radius: a positive `strength` therefore pushes AWAY, hardest up close,
       * and a negative one pulls in.
       * The bird may also fly faster while fleeing (`boost` × 5 on the limit).
       *
       * `radius` is a node because the callable forces each bring their own
       * (a uniform); the others pass `preyRadius` as a constant.
       *
       * A plain function, not a TSL `Fn`: a `Fn` becomes a shader function
       * whose arguments are copies, so its writes to `vel` would be lost.
       * Called inside this pass, it writes its nodes straight into it.
       */
      const prey = float(preyRadius);
      const flee = (
        target: Node<'vec3'>,
        strength: Node<'float'>,
        boost: Node<'float'>,
        radius: Node<'float'>,
      ) => {
        const dir = target.sub(pos);
        const dist = dir.length();
        If(dist.greaterThan(0.0001).and(dist.lessThan(radius)), () => {
          const f = dir.lengthSq()
            .div(radius.mul(radius))
            .sub(1.0)
            .mul(step)
            .mul(100)
            .mul(strength);
          vel.addAssign(dir.normalize().mul(f));
          limit.addAssign(boost.mul(5.));
        });
      };

      // The attractors (predators, at a positive strength).
      Loop(attractorCount, (({ i }) => {
        const att = attractorBuffer.element(i);
        flee(att.xyz, att.w, float(1), prey);
      }));

      /*
       * The repeller line. The nearest point on it to this bird:
       *   t = (pos - origin) · dir, clamped at 0 so the half of the line
       *       behind the origin (behind the camera) repels nothing;
       *   closest = origin + dir × t.
       * Then the same rule as an attractor, faded by uRayStrength.
       */
      If(uRayStrength.greaterThan(0), () => {
        const along = pos.sub(uRayOrigin).dot(uRayDir).max(0);
        const closest = uRayOrigin.add(uRayDir.mul(along));
        flee(closest, uRayStrength, uRayStrength, prey);
      });

      /*
       * The callable forces (forces.ts), each skipped at strength 0, so a
       * visitor for whom neither is ever set pays two comparisons a bird.
       *
       * The repeller flees like the pointer: the bird may speed up, by its
       * strength up to the pointer's full boost.
       * The attractor is the same rule with the strength negated, and no
       * boost: birds rushing in overshoot the point and orbit it harder.
       */
      If(uRepel.w.greaterThan(0), () => {
        flee(uRepel.xyz, uRepel.w, uRepel.w.min(1), uRepelRadius);
      });
      If(uAttract.w.greaterThan(0), () => {
        flee(uAttract.xyz, uAttract.w.negate(), float(0), uAttractRadius);
      });

      // Attract flocks to the center
      const dir = pos.sub(central).mul(vec3(1, 2.5, 1))
      const dist = dir.length();
      If(dist.greaterThan(0.0001), () => {
        vel.subAssign(dir.normalize().mul(step).mul(5.));
      });

      Loop(count, ({ i: other }) => {
        const otherPos = positionBuffer.element(other);
        const otherVel = velocityBuffer.element(other);
        const otherDir = otherPos.sub(pos);
        const otherDist = otherDir.length();

        If(otherDist.lessThan(0.0001), () => { Continue() });

        const otherDistSq = otherDir.lengthSq();
        If(otherDistSq.greaterThan(zoneRadiusSq), () => { Continue(); });

        const percent = otherDistSq.div(zoneRadiusSq);

        If(percent.lessThan(separationThresh), () => {

          // Separation:
          const f = step.mul(float(separationThresh).div(percent).sub(1.0));
          vel.subAssign(otherDir.normalize().mul(f));
        })
        .ElseIf(percent.lessThan(alignmentThresh), () => {

          // Alignment
          const threshDelta = float(alignmentThresh).sub(separationThresh);
          const adjustedPercent = percent.sub(separationThresh).div(threshDelta);

          const f = float(0.5)
            .sub(cos(adjustedPercent.mul(PI2)).mul(0.5))
            .add(0.5)
            .mul(step)
            .mul(uAlignment);

          vel.addAssign(otherVel.normalize().mul(f));
        })
        .Else(() => {
          const threshDelta = float(1.0).sub(alignmentThresh);
          const adjustedPercent = float(0.).toVar();
          If(threshDelta.equal(0.), () => {
            adjustedPercent.assign(1.);
          })
          .Else(() => {
            adjustedPercent.assign(percent.sub(alignmentThresh).div(threshDelta));
          });

          const f = float(0.5)
            .sub(
              float(-.5)
              .mul(cos(adjustedPercent.mul(PI2)))
              .add(.5)
            ).mul(step);

          vel.addAssign(otherDir.normalize().mul(f));
        });

      });

      // Speed limits:
      If(vel.length().greaterThan(limit), () => {
        vel.assign(vel.normalize().mul(limit));
      })

      // The decision, into the scratch buffer: nobody reads it in this pass.
      velocityNextBuffer.element(instanceIndex).assign(vel);
    })().compute(count);

  }, [
    count,
    positionBuffer, velocityBuffer, velocityNextBuffer,
    attractorBuffer, attractorCount, central,
    uRayOrigin, uRayDir, uRayStrength,
    uAttract, uAttractRadius, uRepel, uRepelRadius, uAlignment,
    preyRadius, separationThresh, alignmentThresh, zoneRadiusSq,
  ]);

  // Pass 2: commit each boid's decision to its own slots only.
  const positionComputePass = useMemo(() => {
    return Fn(() => {
      const pos = positionBuffer.element(instanceIndex);
      const velStore = velocityBuffer.element(instanceIndex);
      const phase = phaseBuffer.element(instanceIndex);

      const vel = velocityNextBuffer.element(instanceIndex).toVar();

      // step 7: one write of the finished velocity
      velStore.assign(vel);

      // step 6: advance wing phase from the new velocity
      phase.assign(
        phase
          .add(step)
          .add(vel.xz.length().mul(step).mul(3))
          .add(max(vel.y, 0).mul(step).mul(6))
          .mod(62.83)
      );

      pos.addAssign(vel.mul(step).mul(uSpeedScale));
    })().compute(count);
  }, [count, positionBuffer, velocityBuffer, velocityNextBuffer, phaseBuffer, uSpeedScale]);

  // Decide, then commit. Each compute() is its own dispatch, and WebGPU runs
  // them in order, so pass 2 sees all of pass 1's writes.
  /* eslint-disable react-hooks/immutability -- three.js uniforms are written every frame by design */
  useFrame((_, delta) => {
    // The controls, eased towards what the props ask for. `delta` is capped
    // like the simulation's step, so a tab coming back from the background
    // eases rather than snapping.
    const k = 1 - Math.exp(-Math.min(delta, MAX_STEP) / CONTROL_EASE_SECONDS);
    uAlignment.value += (alignmentWeight(alignment) - uAlignment.value) * k;
    uSpeedScale.value += (speedScale(speed) - uSpeedScale.value) * k;

    // The repeller, from wherever the caller last put it.
    const r = repeller?.current;
    if (r) {
      uRayOrigin.value.set(r.ox, r.oy, r.oz);
      uRayDir.value.set(r.dx, r.dy, r.dz);
    }
    uRayStrength.value = r ? r.strength : 0;

    // The callable forces, from wherever Flock last put them.
    const f = forces?.current;
    if (f) {
      const { attractor: a, repeller: p } = f;
      uAttract.value.set(a.x, a.y, a.z, a.strength);
      uAttractRadius.value = a.radius;
      uRepel.value.set(p.x, p.y, p.z, p.strength);
      uRepelRadius.value = p.radius;
    } else {
      uAttract.value.setW(0);
      uRepel.value.setW(0);
    }

    renderer.compute(velocityComputePass);
    renderer.compute(positionComputePass);
  })
  /* eslint-enable react-hooks/immutability */

  const ctx = useMemo(
  () => ({ count, positionBuffer, velocityBuffer, velocityNextBuffer, phaseBuffer }),
    [count, positionBuffer, velocityBuffer, velocityNextBuffer, phaseBuffer],
  );

  return (
    <BoidsCtx.Provider value={ctx}>
      {children}
    </BoidsCtx.Provider>
  );
}
