import { describe, expect, it } from 'vitest'
import { lineNormalAndOffset, signedDistance } from './tiltShiftMath'

describe('lineNormalAndOffset', () => {
  it('gives the distance from the diagonal', () => {
    const line = lineNormalAndOffset([0, 0], [1, 1])
    expect(Math.abs(signedDistance(line, [1, 0]))).toBeCloseTo(1 / Math.SQRT2, 6)
    expect(signedDistance(line, [0.5, 0.5])).toBeCloseTo(0, 6)
  })

  it('has a unit normal', () => {
    const { nx, ny } = lineNormalAndOffset([0.01, 0.01], [1, 1])
    expect(Math.hypot(nx, ny)).toBeCloseTo(1, 6)
  })

  it('gives a vertical normal for a horizontal line', () => {
    const { nx, ny } = lineNormalAndOffset([0, 0.5], [1, 0.5])
    expect(nx).toBeCloseTo(0, 6)
    expect(Math.abs(ny)).toBeCloseTo(1, 6)
  })

  it('measures from the line, not the origin', () => {
    const line = lineNormalAndOffset([0, 0.5], [1, 0.5])
    expect(Math.abs(signedDistance(line, [0.3, 0.75]))).toBeCloseTo(0.25, 6)
    expect(signedDistance(line, [0.9, 0.5])).toBeCloseTo(0, 6)
  })

  it('refuses a line with no length', () => {
    expect(() => lineNormalAndOffset([0.2, 0.2], [0.2, 0.2])).toThrow()
  })
})
