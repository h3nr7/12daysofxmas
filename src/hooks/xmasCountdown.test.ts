import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { computeXmasState } from './xmasCountdown'

const ZONES = ['Europe/London', 'Pacific/Auckland']

// Builds "now" as a wall-clock time in the given zone.
const at = (iso: string, zone: string) => DateTime.fromISO(iso, { zone })

describe.each(ZONES)('computeXmasState in %s', (zone) => {
  it('is one second before Christmas at 24 Dec 23:59:59', () => {
    const s = computeXmasState(at('2026-12-24T23:59:59', zone))
    expect(s.isXmas).toBe(false)
    expect(s.xmasDayCount).toBe(-1)
    expect(s.timeLeft).toEqual({ days: 0, hours: 0, mins: 0, secs: 1 })
  })

  it('is day 1 at local midnight on 25 Dec', () => {
    const s = computeXmasState(at('2026-12-25T00:00:00', zone))
    expect(s.isXmas).toBe(true)
    expect(s.xmasDayCount).toBe(1)
    expect(s.timeLeft).toEqual({ days: 0, hours: 0, mins: 0, secs: 0 })
  })

  it('is day 8 on 1 Jan, still last year\'s Christmas', () => {
    const s = computeXmasState(at('2027-01-01T12:00:00', zone))
    expect(s.isXmas).toBe(true)
    expect(s.xmasDayCount).toBe(8)
  })

  it('is day 12 at the last second of 5 Jan', () => {
    const s = computeXmasState(at('2027-01-05T23:59:59', zone))
    expect(s.isXmas).toBe(true)
    expect(s.xmasDayCount).toBe(12)
  })

  it('is over at 6 Jan 00:00 and counts to the next Christmas', () => {
    const s = computeXmasState(at('2027-01-06T00:00:00', zone))
    expect(s.isXmas).toBe(false)
    expect(s.xmasDayCount).toBe(-1)
    expect(s.timeLeft).toEqual({ days: 353, hours: 0, mins: 0, secs: 0 })
  })

  it('rounds part seconds up so the count reaches zero at midnight', () => {
    const s = computeXmasState(at('2026-12-24T23:59:58.500', zone))
    expect(s.timeLeft).toEqual({ days: 0, hours: 0, mins: 0, secs: 2 })
  })

  it('keeps isNearXmas to December and January, and reports the day of month', () => {
    expect(computeXmasState(at('2026-11-30T12:00:00', zone)).isNearXmas).toBe(false)
    expect(computeXmasState(at('2026-12-01T12:00:00', zone)).isNearXmas).toBe(true)
    expect(computeXmasState(at('2027-01-31T12:00:00', zone)).isNearXmas).toBe(true)
    expect(computeXmasState(at('2026-12-07T12:00:00', zone)).curDay).toBe(7)
  })
})

describe('computeXmasState across a clock change', () => {
  it('counts calendar days and hours across the end of British Summer Time', () => {
    // BST ends on 25 Oct 2026, so this span has one extra real hour.
    const s = computeXmasState(at('2026-10-20T12:00:00', 'Europe/London'))
    expect(s.timeLeft).toEqual({ days: 65, hours: 12, mins: 0, secs: 0 })
  })
})
