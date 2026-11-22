import { describe, expect, it } from 'vitest'
import { createRing, push, toArray, toSegments } from './ring'

describe('ring', () => {
  it('holds only what was pushed before it fills, oldest first', () => {
    const ring = createRing(3)
    expect(Array.from(toArray(ring))).toEqual([])
    push(ring, 1, 2, 3)
    expect(Array.from(toArray(ring))).toEqual([1, 2, 3])
    push(ring, 4, 5, 6)
    expect(Array.from(toArray(ring))).toEqual([1, 2, 3, 4, 5, 6])
    expect(ring.filled).toBe(2)
  })

  it('keeps the last n points, oldest first, once it has wrapped', () => {
    const ring = createRing(3)
    push(ring, 1, 1, 1) // a
    push(ring, 2, 2, 2) // b
    push(ring, 3, 3, 3) // c
    push(ring, 4, 4, 4) // d
    expect(ring.filled).toBe(3)
    expect(Array.from(toArray(ring))).toEqual([2, 2, 2, 3, 3, 3, 4, 4, 4])
    push(ring, 5, 5, 5)
    push(ring, 6, 6, 6)
    expect(Array.from(toArray(ring))).toEqual([4, 4, 4, 5, 5, 5, 6, 6, 6])
  })

  it('returns an array of length 3 * filled', () => {
    const ring = createRing(4)
    push(ring, 0, 0, 0)
    push(ring, 1, 1, 1)
    expect(toArray(ring)).toBeInstanceOf(Float32Array)
    expect(toArray(ring)).toHaveLength(6)
  })
})

describe('toSegments', () => {
  it('writes consecutive points as start-end pairs, as LineGeometry.setPositions does', () => {
    const points = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
    const out = new Float32Array(12)
    toSegments(points, out)
    expect(Array.from(out)).toEqual([1, 2, 3, 4, 5, 6, 4, 5, 6, 7, 8, 9])
  })
})
