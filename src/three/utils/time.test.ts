import { describe, expect, it } from 'vitest'
import { randomTiming } from './time'

const RUNS = 1000

describe('randomTiming', () => {
  it.each([
    [3.3, 1.2],
    [1, 0.5],
    [10, 0],
  ])('stays within [0, %d] for duration and [0, %d] for delay', (maxTime, maxDelay) => {
    for (let i = 0; i < RUNS; i++) {
      const { duration, delay } = randomTiming(maxTime, maxDelay)
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(duration).toBeLessThanOrEqual(maxTime)
      expect(delay).toBeGreaterThanOrEqual(0)
      expect(delay).toBeLessThanOrEqual(maxDelay)
    }
  })

  it('defaults to 3.3 and 1.2', () => {
    for (let i = 0; i < RUNS; i++) {
      const { duration, delay } = randomTiming()
      expect(duration).toBeLessThanOrEqual(3.3)
      expect(delay).toBeLessThanOrEqual(1.2)
    }
  })
})
