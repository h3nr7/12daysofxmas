import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { cross, float, hash, instanceIndex, positionLocal, select, texture, time, vec2, vec3, vertexIndex } from 'three/tsl'
import { InstancedBufferGeometry, type Mesh, type MeshStandardMaterial, MeshStandardNodeMaterial } from 'three/webgpu'
import { useBoids } from '../../flock'
import { bakeAnimation } from './bakeAnimation'

export interface BoidsParrotProps {
  /** The bird: a GLTF whose first mesh has position morph targets and a clip (Parrot.glb). */
  url: string
  /**
   * Boid units per model unit. The parrot is about 80 model units across the
   * wings, so 0.15 is a 12-unit wingspan, the reference butterfly's.
   */
  size?: number
  /**
   * How fast the wings beat: the clip's rows per second over the texture's
   * height, so 1 plays a 70-frame clip in a 128-row texture in 0.55 s.
   */
  speed?: number
}

/**
 * The parrot, one bird per boid from the flock's buffers (see "Composing
 * Boids with another bird" in src/three/flock/README.md). One bird's
 * vertices, instanced `count` times; the vertex stage reads its boid's slot,
 * samples the baked wing beat by vertex and time, scales, turns the bird
 * into its flight basis as `Butterfly.tsx` does, and moves it to the boid.
 */
export function BoidsParrot({ url, size = 0.15, speed = 1 }: BoidsParrotProps) {
  const gltf = useGLTF(url)
  const { count, positionBuffer, velocityBuffer } = useBoids()

  const bird = gltf.scene.children[0] as Mesh
  const birdGeometry = bird.geometry
  const map = (bird.material as MeshStandardMaterial).map

  const animation = useMemo(() => bakeAnimation(gltf), [gltf])

  // The bird's own position, uv and index, drawn `count` times. The
  // attributes are shared with the loaded geometry, not copied.
  const geometry = useMemo(() => {
    const instanced = new InstancedBufferGeometry()
    instanced.setAttribute('position', birdGeometry.getAttribute('position'))
    instanced.setAttribute('uv', birdGeometry.getAttribute('uv'))
    instanced.setIndex(birdGeometry.index)
    // Defaults to Infinity, which WebGPU can't draw.
    instanced.instanceCount = count
    return instanced
  }, [birdGeometry, count])

  const material = useMemo(() => {
    if (!positionBuffer || !velocityBuffer) return

    const mat = new MeshStandardNodeMaterial({
      map,
      flatShading: true,
      roughness: 1,
      metalness: 0,
    })
    mat.fog = false

    const { texture: frames, tWidth, tHeight, duration } = animation

    // This bird's slot in the flock.
    const boidPosition = positionBuffer.element(instanceIndex)
    const boidVelocity = velocityBuffer.element(instanceIndex)

    /*
     * The wing beat. u picks the vertex's column (half a texel in, so the
     * lookup lands on the texel either way it is filtered); v runs with time
     * over the rows that hold frames, started at a different point for each
     * bird so the flock does not beat as one.
     */
    const u = float(vertexIndex).add(0.5).div(tWidth)
    const v = time.mul(speed).add(hash(instanceIndex)).mod(duration / tHeight)
    const aniPos = texture(frames, vec2(u, v)).xyz

    // The bird's size, varied a fifth either way by a second hash.
    const scale = float(size).add(hash(instanceIndex.add(1)).mul(size * 0.2))
    const local = positionLocal.add(aniPos).mul(scale)

    // The flight basis, as Butterfly.tsx builds it.
    // forward = flight direction, with a fallback for a boid that isn't moving
    const velocityLength = boidVelocity.length()
    const forward = select(
      velocityLength.greaterThan(0.0001),
      boidVelocity.div(velocityLength.max(0.0001)),
      vec3(0, 0, 1),
    )
    // right = world up × forward, with a fallback for flying straight up or down
    const side = cross(vec3(0, 1, 0), forward)
    const sideLength = side.length()
    const right = select(
      sideLength.greaterThan(0.0001),
      side.div(sideLength.max(0.0001)),
      vec3(1, 0, 0),
    )
    // the bird's own up axis completes the basis
    const up = cross(forward, right)

    // The model's beak is along +z, so local z goes along forward.
    const oriented = right.mul(local.x)
      .add(up.mul(local.y))
      .add(forward.mul(local.z))

    mat.positionNode = oriented.add(boidPosition)

    return mat
  }, [positionBuffer, velocityBuffer, map, animation, size, speed])

  if (!material) return null

  return (
    // Positions come from the buffer, so the geometry's bounds say nothing
    // about where the birds are: never cull.
    <mesh geometry={geometry} material={material} frustumCulled={false} />
  )
}
