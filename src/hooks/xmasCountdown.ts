import { DateTime } from 'luxon'

export interface TimeLeft {
  days: number
  hours: number
  mins: number
  secs: number
}

export interface XmasState {
  curIso: string
  curDay: number
  isNearXmas: boolean
  isXmas: boolean
  // 1 on 25 December through 12 on 5 January; -1 outside Christmas.
  xmasDayCount: number
  // Time until the next 25 December. All zero during Christmas.
  timeLeft: TimeLeft
}

export const XMAS_DAYS = 12

const NO_TIME_LEFT: TimeLeft = { days: 0, hours: 0, mins: 0, secs: 0 }

/**
 * The Christmas state at `now`, worked out in the zone of `now`, so each
 * visitor's Christmas starts at their own local midnight on 25 December
 * and runs until local midnight at the start of 6 January.
 */
export function computeXmasState(now: DateTime): XmasState {
  // 1 to 5 January still belong to the previous year's Christmas.
  const xmasYear = now.month === 1 && now.day <= 5 ? now.year - 1 : now.year
  const start = now.set({ year: xmasYear, month: 12, day: 25 }).startOf('day')
  const end = start.plus({ days: XMAS_DAYS })
  const isXmas = now >= start && now < end

  let xmasDayCount = -1
  let timeLeft = NO_TIME_LEFT
  if (isXmas) {
    xmasDayCount = Math.round(now.startOf('day').diff(start, 'days').days) + 1
  } else {
    // Outside Christmas the next one is always `start`. Dropping the part
    // second from `now` rounds the time left up, so the count reaches zero
    // exactly at midnight.
    const left = start.diff(now.startOf('second'), ['days', 'hours', 'minutes', 'seconds'])
    timeLeft = {
      days: left.days,
      hours: left.hours,
      mins: left.minutes,
      secs: Math.round(left.seconds),
    }
  }

  return {
    curIso: now.toISO() ?? '',
    curDay: now.day,
    isNearXmas: now.month === 12 || now.month === 1,
    isXmas,
    xmasDayCount,
    timeLeft,
  }
}
