import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseDebug, withDebug } from './debug'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseDebug', () => {
  it('is off with no search', () => {
    expect(parseDebug('')).toEqual({ on: false })
  })

  it.each(['?debug', '?debug=1', 'debug', '?debug=yes'])('is on for %s', (search) => {
    expect(parseDebug(search)).toEqual({ on: true })
  })

  it.each(['?debug=0', '?debug=false', '?debug=off'])('is off for %s', (search) => {
    expect(parseDebug(search)).toEqual({ on: false })
  })

  it('reads the date when debug is on', () => {
    expect(parseDebug('?debug&date=2026-12-27')).toEqual({ on: true, date: '2026-12-27' })
  })

  it('ignores the date when debug is off', () => {
    expect(parseDebug('?date=2026-12-27')).toEqual({ on: false })
    expect(parseDebug('?debug=off&date=2026-12-27')).toEqual({ on: false })
  })

  it.each(['2026-13-40', '2026-02-29', 'tomorrow', '27-12-2026', '2026-12-27T10:00'])(
    'drops the invalid date %s with one warning, and stays on',
    (date) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parseDebug(`?debug&date=${date}`)).toEqual({ on: true })
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0][0]).toContain(`"${date}"`)
    },
  )

  it('does not warn for a valid date or no date', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    parseDebug('?debug&date=2026-12-27')
    parseDebug('?debug')
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('withDebug', () => {
  it('returns the path unchanged when debug is off', () => {
    expect(withDebug('/third', '')).toBe('/third')
    expect(withDebug('/third', '?date=2026-12-27')).toBe('/third')
    expect(withDebug('/', '?debug=off')).toBe('/')
  })

  it('carries debug', () => {
    expect(withDebug('/third', '?debug')).toBe('/third?debug')
  })

  it('carries debug and the date, written as typed', () => {
    expect(withDebug('/third', '?debug&date=2026-12-27')).toBe('/third?debug&date=2026-12-27')
  })

  it('drops other params', () => {
    expect(withDebug('/third', '?debug&utm_source=x')).toBe('/third?debug')
  })

  it('drops an invalid date', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(withDebug('/', '?debug&date=tomorrow')).toBe('/?debug')
  })
})
