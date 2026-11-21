import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { DateTime } from 'luxon'

// Debug mode lives only in the URL: `?debug` turns it on and
// `&date=YYYY-MM-DD` makes the site behave as on that date. Links carry
// both from page to page (see debugNavigation.tsx), so removing them from
// the URL turns debug off. Design: docs/plans/2026-11-21-debug-mode-design.md

export interface DebugState {
  on: boolean
  // A valid YYYY-MM-DD date, only ever set when `on` is true.
  date?: string
}

const OFF_VALUES = ['0', 'false', 'off']
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/

/** Reads debug mode from a URL search string, with or without the `?`. */
export function parseDebug(search: string): DebugState {
  const params = new URLSearchParams(search)
  const value = params.get('debug')
  if (value === null || OFF_VALUES.includes(value.toLowerCase())) return { on: false }

  const date = params.get('date')
  if (date === null) return { on: true }
  if (DATE_SHAPE.test(date) && DateTime.fromISO(date).isValid) return { on: true, date }

  // A warning, not an error: a bad test URL mustn't look like a crash.
  console.warn(`debug: ignoring date "${date}", expected YYYY-MM-DD`)
  return { on: true }
}

/**
 * `path` with debug mode carried over from `search`. Unchanged when debug
 * is off, so visitors' URLs stay as they are. Written by hand so the URL
 * reads `?debug&date=…`, as typed, not `?debug=&date=…`.
 */
export function withDebug(path: string, search: string): string {
  const { on, date } = parseDebug(search)
  if (!on) return path
  return date ? `${path}?debug&date=${date}` : `${path}?debug`
}

/** Debug mode for the current URL. */
export function useDebug(): DebugState {
  const { search } = useLocation()
  return useMemo(() => parseDebug(search), [search])
}
