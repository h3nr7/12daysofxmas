import { type AnimationClip, DataTexture, FloatType, type Group, type Mesh, RGBAFormat } from 'three/webgpu'
import { nextPowerOf2 } from './helpers/math'

/**
 * What the bake needs of a loaded GLTF: its clips and a scene whose first
 * child is the bird, a mesh with position morph targets (Parrot.glb).
 */
export interface BirdGltf {
  animations: AnimationClip[]
  scene: Group
}

export interface BakedAnimation {
  /**
   * The wing beat, one row per frame and one texel per vertex: xyz is where
   * that vertex is on that frame, w is 1. A float texture with nearest
   * filtering (DataTexture's default), so a lookup lands on one frame.
   */
  texture: DataTexture
  /** Texels per row: the bird's vertex count rounded up to a power of two. */
  tWidth: number
  /** Rows: `duration` rounded up to a power of two. */
  tHeight: number
  /**
   * The clip's length in frames at 60 a second; the rows that hold data.
   * `duration / tHeight` is the span of v a lookup loops over.
   */
  duration: number
}

/**
 * Bakes the first clip's morph targets into a texture the vertex stage can
 * sample by vertex and time, in place of three's morph machinery, which has
 * no say over an instanced bird. The loop is the one `BoidsGltf` ran
 * (three's webgl_gpgpu_birds_gltf example): each frame is a linear blend of
 * the two morph targets it falls between.
 */
export function bakeAnimation(gltf: BirdGltf): BakedAnimation {
  const bird = gltf.scene.children[0] as Mesh
  const geometry = bird.geometry
  const morphs = geometry.morphAttributes.position
  if (!morphs) throw new Error('bakeAnimation: the model has no position morph targets to animate')

  const vertexCount = geometry.getAttribute('position').count
  const duration = Math.round(gltf.animations[0].duration * 60)
  const tWidth = nextPowerOf2(vertexCount)
  const tHeight = nextPowerOf2(duration)
  const data = new Float32Array(4 * tWidth * tHeight)

  for (let j = 0; j < duration; j++) {
    const offset = j * tWidth * 4
    const along = (j / duration) * morphs.length
    const cur = morphs[Math.floor(along)]
    const next = morphs[(Math.floor(along) + 1) % morphs.length]
    const lerp = along % 1

    // Only the bird's vertices; the padding to the power of two stays 0.
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3
      const i4 = offset + i * 4
      data[i4] = cur.array[i3] + (next.array[i3] - cur.array[i3]) * lerp
      data[i4 + 1] = cur.array[i3 + 1] + (next.array[i3 + 1] - cur.array[i3 + 1]) * lerp
      data[i4 + 2] = cur.array[i3 + 2] + (next.array[i3 + 2] - cur.array[i3 + 2]) * lerp
      data[i4 + 3] = 1
    }
  }

  const texture = new DataTexture(data, tWidth, tHeight, RGBAFormat, FloatType)
  texture.needsUpdate = true

  return { texture, tWidth, tHeight, duration }
}
