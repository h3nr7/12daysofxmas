import { useMemo } from "react"
import { AdditiveBlending, InstancedBufferAttribute, Spherical, SpriteNodeMaterial, Vector3 } from "three/webgpu"
import { exp, float, instancedBufferAttribute, sin, time, uv, vec2, vec3 } from "three/tsl"

/**
 * A star field on WebGPU: one small plane instanced `count` times, drawn by
 * a `SpriteNodeMaterial` that reads each star's position, size and seed from
 * instanced attributes. Replaces drei's `Stars`, whose ShaderMaterial draws
 * nothing on WebGPU (H3N-96). Same props and the same shell scatter.
 */
export interface StarsProps {
  /** Inner radius of the shell the stars sit on. */
  radius?: number
  /** Thickness of the shell, outward from `radius`. */
  depth?: number
  count?: number
  /** Size multiplier: each star is 0.5 to 1.5 times this. */
  factor?: number
  /** 0 is white; anything up to 1 tints the stars slightly blue. */
  saturation?: number
  /** Fade each sprite from its centre to its edge instead of a hard square. */
  fade?: boolean
  /** Twinkle speed. */
  speed?: number
}

// World units per unit of `size`, by eye: at radius 200 a size of 4 should
// read as a small point, not a disc.
const STAR_SCALE = 0.12

// Drei's Stars used Math.random, which is impure; the scatter is seeded so
// render stays pure and the same props give the same sky.
const SCATTER_SEED = 0x5eed

// A seeded random in [0, 1): mulberry32.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Drei's scatter: the radius walks inward from radius + depth by a random
// share of depth / count per star, and each star sits at a uniformly random
// direction on that sphere.
function scatter(radius: number, depth: number, count: number, factor: number) {
  const random = mulberry32(SCATTER_SEED)
  const position = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const seed = new Float32Array(count)
  const point = new Vector3()
  const spherical = new Spherical()
  let r = radius + depth
  const increment = depth / count
  for (let i = 0; i < count; i++) {
    r -= increment * random()
    spherical.set(r, Math.acos(1 - random() * 2), random() * 2 * Math.PI)
    point.setFromSpherical(spherical).toArray(position, i * 3)
    size[i] = (0.5 + random()) * factor
    seed[i] = random() * 2 * Math.PI
  }
  return { position, size, seed }
}

// The one quad every star is an instance of: a unit plane, as PlaneGeometry
// lays it out, so the sprite's uv runs 0 to 1 across it.
const QUAD_POSITION = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0])
const QUAD_UV = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0])
const QUAD_INDEX = new Uint16Array([0, 2, 1, 2, 3, 1])

export function Stars({
  radius = 200,
  depth = 10,
  count = 1500,
  factor = 4,
  saturation = 0,
  fade = false,
  speed = 1,
}: StarsProps) {

  const stars = useMemo(() => scatter(radius, depth, count, factor), [radius, depth, count, factor])

  const material = useMemo(() => {
    const material = new SpriteNodeMaterial({
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    // The shell sits far beyond the scene's fog, which would hide it.
    material.fog = false
    const size = instancedBufferAttribute<'float'>(new InstancedBufferAttribute(stars.size, 1), 'float')
    const seed = instancedBufferAttribute<'float'>(new InstancedBufferAttribute(stars.seed, 1), 'float')
    material.positionNode = instancedBufferAttribute<'vec3'>(new InstancedBufferAttribute(stars.position, 3), 'vec3')
    // Twinkle: each star breathes between 0.5 and 1 of its size, out of phase.
    material.scaleNode = size.mul(sin(time.mul(speed).add(seed)).mul(0.25).add(0.75)).mul(STAR_SCALE)
    const tint = Math.min(Math.max(saturation, 0), 1)
    material.colorNode = vec3(1 - 0.15 * tint, 1 - 0.05 * tint, 1)
    if (fade) {
      // Drei's fade: a logistic falloff from the centre of the sprite.
      const d = uv().distance(vec2(0.5))
      material.opacityNode = float(1).div(exp(d.sub(0.25).mul(16)).add(1))
    }
    return material
  }, [stars, saturation, fade, speed])

  return (
    <mesh frustumCulled={false}>
      <instancedBufferGeometry instanceCount={count}>
        <bufferAttribute attach="attributes-position" args={[QUAD_POSITION, 3]} />
        <bufferAttribute attach="attributes-uv" args={[QUAD_UV, 2]} />
        <bufferAttribute attach="index" args={[QUAD_INDEX, 1]} />
      </instancedBufferGeometry>
      <primitive object={material} attach="material" />
    </mesh>
  )
}
