import { describe, expect, it } from 'vitest'
import { nextPowerOf2 } from './math'

describe('nextPowerOf2', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 4],
    [1000, 1024],
  ])('nextPowerOf2(%i) is %i', (n, expected) => {
    expect(nextPowerOf2(n)).toBe(expected)
  })
})
