import { describe, expect, it } from 'vitest'
import type { DataTexture } from 'three/webgpu'
import { fillPositionTexture, fillVelocityTexture } from './initialisers'

const TEXELS = 1024

const fakeTexture = () =>
  ({ image: { data: new Float32Array(TEXELS * 4) } }) as unknown as DataTexture

const texels = (texture: DataTexture) => {
  const data = texture.image.data as Float32Array
  const out: number[][] = []
  for (let k = 0; k < data.length; k += 4) out.push([data[k], data[k + 1], data[k + 2], data[k + 3]])
  return out
}

describe('fillPositionTexture', () => {
  it('fills x, y, z in [-5, 5) with w = 1', () => {
    const texture = fakeTexture()
    fillPositionTexture(texture)
    for (const [x, y, z, w] of texels(texture)) {
      for (const v of [x, y, z]) {
        expect(v).toBeGreaterThanOrEqual(-5)
        expect(v).toBeLessThan(5)
      }
      expect(w).toBe(1)
    }
  })

  it('ignores its bounds argument', () => {
    // Pins today's behaviour: the bounds parameter is unused and BOUNDS (10)
    // is always applied.
    const texture = fakeTexture()
    fillPositionTexture(texture, 1000)
    for (const [x, y, z] of texels(texture)) {
      for (const v of [x, y, z]) expect(Math.abs(v)).toBeLessThanOrEqual(5)
    }
  })
})

describe('fillVelocityTexture', () => {
  it('fills x, y, z in [-5, 5) with w = 1', () => {
    const texture = fakeTexture()
    fillVelocityTexture(texture)
    for (const [x, y, z, w] of texels(texture)) {
      for (const v of [x, y, z]) {
        expect(v).toBeGreaterThanOrEqual(-5)
        expect(v).toBeLessThan(5)
      }
      expect(w).toBe(1)
    }
  })
})
