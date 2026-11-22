/*
 * Taken from h3nr7 `packages/canvas/src/visuals/flock/Butterfly.tsx` on
 * 2026-11-21. Changed only where the reference stands alone: the opacity
 * follows an optional `fade` ref in place of the stage's `presence`, and
 * `depthTest` is a prop (default on; h3nr7's stage, which has no depth
 * buffer, had it off). Still no frustum culling: positions come from the
 * compute buffer, so three's bounds for the geometry say nothing about where
 * the birds are.
 */
import * as THREE from "three/webgpu";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { positionLocal, instanceIndex, vec3, select, cross, uniform, uniformArray, hash } from "three/tsl";
import { useBoids } from "./Boids";


function ButterflyGeometry({ count = 1 }: { count: number }) {
  const vertices = useMemo(() => {
    const HEAD_HEIGHT = 1
    const FRONT_WINGSPAN = 6;
    const REAR_WINGSPAN = 2.5;
    const TOP_LENGTH = 5;
    const REAR_LENGTH = 2.5
    return  new Float32Array([
      // BODY
      0, 0, -REAR_LENGTH,
      0, 0, TOP_LENGTH,
      0, HEAD_HEIGHT, TOP_LENGTH,
      // WINGS
      // Top, left
      0, 0, -REAR_LENGTH,
      0, 0, 0,
      -REAR_WINGSPAN, 0, -REAR_LENGTH,
      // Top, right
      0, 0, -REAR_LENGTH,
      0, 0, 0,
      REAR_WINGSPAN, 0, -REAR_LENGTH,
      // Bottom, left
      -FRONT_WINGSPAN, 0, TOP_LENGTH,
      0, 0, 0,
      0, 0, TOP_LENGTH,
      // Bottom, right
      FRONT_WINGSPAN, 0, TOP_LENGTH,
      0, 0, 0,
      0, 0, TOP_LENGTH
    ]);
  }, []);

  // The colour is picked per bird in the material from the palette uniform,
  // so no per-instance colour buffer here.

  // Per-vertex `position` is a plain attribute; only the per-bird data is
  // instanced. `instanceCount` must be set: it defaults to Infinity, which
  // WebGPU can't draw.
  return (
    <instancedBufferGeometry instanceCount={count}>
      <bufferAttribute attach="attributes-position" args={[vertices, 3]} />
    </instancedBufferGeometry>
  )
}

export type ButterflyProps = {
  /**
   * The palette. Each bird draws one of these, picked once from its own index,
   * so the mix is fixed for the life of the flock. One entry: every bird alike.
   */
  colours: readonly string[];
  /** Every bird's alpha, 0..1, before `fade` scales it. */
  opacity?: number;
  /**
   * A 0..1 ref the birds' opacity follows, read every frame, so a page can
   * fade the flock in and out without a React render. Absent: 1.
   */
  fade?: { current: number };
  /**
   * Whether the birds test and write depth. On, in a scene with other
   * objects. Off, when the canvas has no depth buffer or the flock should
   * draw over everything, as a background does.
   */
  depthTest?: boolean;
};

export function Butterfly({
  colours,
  opacity = 1,
  fade,
  depthTest = true,
}: ButterflyProps) {
  const { positionBuffer, velocityBuffer, phaseBuffer } = useBoids();
  const { count } = useBoids();

  /*
   * The palette, as a uniform array of colours.
   *
   * A change of colours that keeps their number only `set`s these Color
   * objects: `uniformArray` copies them into the GPU buffer on every render,
   * and the material is untouched. A palette of a different LENGTH rebuilds
   * the material, since the array's size is part of the shader.
   */
  const paletteLength = Math.max(colours.length, 1);
  const [paletteColours, uPalette] = useMemo(() => {
    const values = Array.from({ length: paletteLength }, () => new THREE.Color());
    return [values, uniformArray<'color'>(values, 'color')] as const;
  }, [paletteLength]);
  useEffect(() => {
    paletteColours.forEach((value, i) => value.set(colours[i] ?? colours[0] ?? '#000'));
  }, [paletteColours, colours]);

  // Uniforms, so a fade changes a value rather than rebuilding the material.
  const uFade = useMemo(() => uniform(1), []);
  const uOpacity = useMemo(() => uniform(1), []);
  /* eslint-disable react-hooks/immutability -- three.js uniforms are written in place by design */
  useEffect(() => {
    uOpacity.value = opacity;
  }, [uOpacity, opacity]);
  useFrame(() => {
    uFade.value = fade?.current ?? 1;
  });
  /* eslint-enable react-hooks/immutability */

  const material = useMemo(() => {
    if(!positionBuffer || !velocityBuffer || !phaseBuffer) return;

    const mat = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      // Transparent so `fade` and `opacity` can thin the flock.
      transparent: true,
    })

    // Extract the precise vector row for the current processing thread
    const currentBoidPosition = positionBuffer.element(instanceIndex)
    const currentBoidPhase = phaseBuffer.element(instanceIndex)

    // Random Flap Math:
    const baseFlap = currentBoidPhase.sin().mul(.4);

    // Mask the flap effect by distance from center spine (X = 0 doesn't move)
    const wingDistance = positionLocal.x.abs();
    const yFlapOffset = baseFlap.mul(wingDistance);

    // Construct a safe 3D displacement vector using vec4 swizzling workaround
    const displacementVector = vec3(0.0, yFlapOffset, 0.0)

    const currentBoidVelocity = velocityBuffer.element(instanceIndex);

    // forward = flight direction, with a fallback for a boid that isn't moving
    const speed = currentBoidVelocity.length();
    const forward = select(
      speed.greaterThan(0.0001),
      currentBoidVelocity.div(speed.max(0.0001)),
      vec3(0, 0, 1),
    );

    // right = world up × forward, with a fallback for flying straight up or down
    const side = cross(vec3(0, 1, 0), forward);
    const sideLength = side.length();
    const right = select(
      sideLength.greaterThan(0.0001),
      side.div(sideLength.max(0.0001)),
      vec3(1, 0, 0),
    );

    // the butterfly's own up axis completes the basis
    const up = cross(forward, right);

    // flap in local space, rotate into the flight basis, then move to the boid
    const local = positionLocal.add(displacementVector);
    const oriented = right.mul(local.x)
      .add(up.mul(local.y))
      .add(forward.mul(local.z));

    mat.positionNode = oriented.add(currentBoidPosition);


    /*
     * Each bird's colour: hash its instance index to a number in [0, 1), scale
     * to the palette and round down. The same bird always gets the same
     * colour, and neighbours in the buffer get unrelated ones, with no
     * per-bird data to store.
     */
    const pick = hash(instanceIndex).mul(paletteLength).floor().min(paletteLength - 1).toInt();
    mat.colorNode = uPalette.element(pick);
    mat.opacityNode = uOpacity.mul(uFade);

    return mat
  }, [positionBuffer, velocityBuffer, phaseBuffer, uPalette, paletteLength, uFade, uOpacity])

  // Depth is render state, not shader code: set on the material in place, so
  // flipping it never rebuilds the shader.
  useEffect(() => {
    if (!material) return;
    /* eslint-disable react-hooks/immutability -- three.js materials take render state by assignment */
    material.depthTest = depthTest;
    material.depthWrite = depthTest;
    /* eslint-enable react-hooks/immutability */
  }, [material, depthTest]);

  return (
    // No scale or rotation here: boid space is placed by the group in Flock.tsx.
    <mesh material={material} frustumCulled={false}>
      <ButterflyGeometry count={count}/>
    </mesh>
  )
}
