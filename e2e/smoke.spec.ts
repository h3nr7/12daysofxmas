// Smoke test: every route mounts with a live 3D canvas and no errors,
// against the production build (see playwright.config.ts).

import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Day routes come from DAYS in src/helpers/constants.tsx. That file imports
// React components and styles, so it is read as text instead of imported.
const constantsSource = readFileSync(path.resolve('src/helpers/constants.tsx'), 'utf8')
const DAY_ROUTES = [...constantsSource.matchAll(/\bday:\s*["']([^"']+)["']/g)].map((m) => `/${m[1]}`)

const ROUTES = ['/', ...DAY_ROUTES, '/sandbox']

const CLOCKS = [
  { name: 'during Christmas', time: '2026-12-27T12:00:00' },
  { name: 'before Christmas', time: '2026-11-21T12:00:00' },
]

// Errors that are known and harmless. Each entry needs a reason.
const ALLOWED_ERRORS: { pattern: RegExp; reason: string }[] = []

// How long to keep watching for errors once the scene is up, so errors
// thrown during enter animations are caught.
const SETTLE_MS = 3000

test.describe.configure({ timeout: 90_000 })

test('finds all 12 day routes in DAYS', () => {
  expect(DAY_ROUTES).toHaveLength(12)
})

const isAllowed = (error: string) => ALLOWED_ERRORS.some((a) => a.pattern.test(error))

// Collects errors for the final check, and rejects `firstUncaught` as soon
// as an uncaught error is thrown, so a crashed page fails fast with its
// message instead of timing out.
function watchErrors(page: Page) {
  const errors: string[] = []
  let reject: (err: Error) => void = () => {}
  const firstUncaught = new Promise<never>((_, r) => (reject = r))
  firstUncaught.catch(() => {}) // also reported by the final check
  page.on('pageerror', (err) => {
    const text = `pageerror: ${err.message}`
    errors.push(text)
    if (!isAllowed(text)) reject(new Error(text))
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return { firstUncaught, unexpected: () => errors.filter((e) => !isAllowed(e)) }
}

async function waitUntilReady(page: Page) {
  // three.js marks the canvas it renders into with data-engine, so this
  // fails if the renderer never started, not just if a canvas exists.
  const canvas = page.locator('canvas[data-engine]')
  await expect(canvas).toHaveCount(1, { timeout: 60_000 })

  await page.waitForLoadState('networkidle')
  await expect(page.locator('.loading__container')).toHaveCount(0, { timeout: 60_000 })

  return canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('webgl2') ?? el.getContext('webgl')
    return {
      width: el.width,
      height: el.height,
      hasContext: !!ctx,
      lost: ctx ? ctx.isContextLost() : true,
    }
  })
}

for (const clock of CLOCKS) {
  test.describe(clock.name, () => {
    for (const route of ROUTES) {
      test(`${route} mounts with a live canvas and no errors`, async ({ page }) => {
        const errors = watchErrors(page)
        await page.clock.install({ time: new Date(clock.time) })
        await page.goto(route)

        const gl = await Promise.race([waitUntilReady(page), errors.firstUncaught])
        expect(gl.width).toBeGreaterThan(0)
        expect(gl.height).toBeGreaterThan(0)
        expect(gl.hasContext).toBe(true)
        expect(gl.lost).toBe(false)

        await Promise.race([page.waitForTimeout(SETTLE_MS), errors.firstUncaught])
        expect(errors.unexpected()).toEqual([])
      })
    }
  })
}
