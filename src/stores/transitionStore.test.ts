import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TRANSITION_DURATION, useTransitionStore } from './transitionStore'

const state = () => useTransitionStore.getState().state

beforeEach(() => {
  vi.useFakeTimers()
  useTransitionStore.setState({ state: 'INIT', timeoutRef: undefined })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('transitionStore', () => {
  it('uses a 2000 ms transition', () => {
    expect(TRANSITION_DURATION).toBe(2000)
  })

  it('init() is INIT, then COMPLETED after 2000 ms', () => {
    useTransitionStore.getState().init()
    expect(state()).toBe('INIT')
    vi.advanceTimersByTime(1999)
    expect(state()).toBe('INIT')
    vi.advanceTimersByTime(1)
    expect(state()).toBe('COMPLETED')
  })

  it('exit() is EXIT, then COMPLETED after 2000 ms', () => {
    useTransitionStore.getState().exit()
    expect(state()).toBe('EXIT')
    vi.advanceTimersByTime(1999)
    expect(state()).toBe('EXIT')
    vi.advanceTimersByTime(1)
    expect(state()).toBe('COMPLETED')
  })

  it('abort() straight after init() completes at once and clears the pending timer', () => {
    useTransitionStore.getState().init()
    expect(vi.getTimerCount()).toBe(1)
    useTransitionStore.getState().abort()
    expect(state()).toBe('COMPLETED')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('abort() after exit() leaves the exit timer running', () => {
    // Pins today's behaviour: exit() does not store its timer, so abort()
    // cannot cancel it. The timer only sets COMPLETED again, which is harmless.
    useTransitionStore.getState().exit()
    useTransitionStore.getState().abort()
    expect(state()).toBe('COMPLETED')
    expect(vi.getTimerCount()).toBe(1)
  })
})
