import { describe, expect, it } from 'vitest'
import { easeOut } from 'motion/react'
import { toSpring, TRANSFORM_SPRING } from './useEnterExit'

describe('toSpring', () => {
  it('turns a framer-motion tween in seconds into a react-spring tween in ms, eased out as framer-motion did', () => {
    expect(toSpring({ duration: 1.25, delay: 3.2 })).toEqual({
      config: { duration: 1250, easing: easeOut },
      delay: 3200,
    })
  })

  it('gives a tween with no duration 0.3 s, as framer-motion does', () => {
    expect(toSpring({ duration: undefined })).toEqual({ config: { duration: 300, easing: easeOut }, delay: 0 })
    expect(toSpring({ delay: 1 })).toEqual({ config: { duration: 300, easing: easeOut }, delay: 1000 })
  })

  it('keeps an instant tween instant instead of falling back to a spring', () => {
    expect(toSpring({ duration: 0 }).config.duration).toBe(1)
  })

  it('passes a spring through', () => {
    expect(toSpring({ spring: TRANSFORM_SPRING, delay: 0.5 })).toEqual({
      config: { tension: 500, friction: 25 },
      delay: 500,
    })
  })
})
