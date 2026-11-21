import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { randomDistance, randomOrbit } from './vecs'

const RUNS = 1000
const EPSILON = 1e-9

describe('randomDistance', () => {
  it.each([1, 7, 20])('stays within [-d/2, d/2] on both axes for d = %d', (d) => {
    for (let i = 0; i < RUNS; i++) {
      const { x, z } = randomDistance(d)
      expect(Math.abs(x)).toBeLessThanOrEqual(d / 2)
      expect(Math.abs(z)).toBeLessThanOrEqual(d / 2)
    }
  })
})

describe('randomOrbit', () => {
  it('is a closed curve of 4 control points, each within the radius of the centre', () => {
    const center = new Vector3(0, 1.8, 0)
    const radius = 2.5
    for (let i = 0; i < RUNS; i++) {
      const curve = randomOrbit(center, radius)
      expect(curve.closed).toBe(true)
      expect(curve.points).toHaveLength(4)
      for (const p of curve.points) {
        expect(p.distanceTo(center)).toBeLessThanOrEqual(radius + EPSILON)
      }
    }
  })

  it('does not change the centre it is given', () => {
    const center = new Vector3(1, 2, 3)
    randomOrbit(center, 1)
    expect(center.toArray()).toEqual([1, 2, 3])
  })
})
