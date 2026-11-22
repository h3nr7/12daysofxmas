// Smoke test: every route mounts with a live 3D canvas and no errors,
// against the production build (see playwright.config.ts).

import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { NO_ADAPTER, WEBGPU_CANVAS, probeWebGPU } from './browser'

// Day routes come from DAYS in src/helpers/constants.tsx. That file imports
// React components and styles, so it is read as text instead of imported.
const constantsSource = readFileSync(path.resolve('src/helpers/constants.tsx'), 'utf8')
const DAY_ROUTES = [...constantsSource.matchAll(/\bday:\s*["']([^"']+)["']/g)].map((m) => `/${m[1]}`)

const ROUTES = ['/', ...DAY_ROUTES, '/sandbox']

// Routes with a 3D scene mounted in src/three/ThreeView.tsx.
const SCENE_ROUTES = ['/', '/first', '/fifth', '/eighth', '/sandbox']

// Until 2026-11-21 every route ran under both clocks (29 tests). While the
// scenes were reworked the owner cut it back to the routes with a scene,
// plus the countdown on / before Christmas (H3N-68). The rest are listed as
// skipped. To run them all again, set `runs` to ROUTES on both clocks.
// Every route that runs waits for a WebGPU canvas, so all of them skip with
// NO_ADAPTER when the browser has no usable adapter (see e2e/browser.ts).
const CLOCKS = [
  { name: 'during Christmas', time: '2026-12-27T12:00:00', runs: SCENE_ROUTES },
  { name: 'before Christmas', time: '2026-11-21T12:00:00', runs: ['/'] },
]

// Errors that are known and harmless. Each entry needs a reason.
const ALLOWED_ERRORS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /WebGPU Device Lost|Instance dropped in popErrorScope/,
    reason:
      "CI has no GPU. Chromium's software WebGPU (SwiftShader) drops the device soon after three " +
      'starts; three logs the loss, and its pipeline error checks reject unhandled. The test checks ' +
      'that each scene mounts and starts on WebGPU, not the GPU it runs on.',
  },
]

// How long to keep watching for errors once the scene is up, so errors
// thrown during enter animations are caught.
const SETTLE_MS = 3000

test.describe.configure({ timeout: 90_000 })

test('finds all 12 day routes in DAYS', () => {
  expect(DAY_ROUTES).toHaveLength(12)
})

// Asked once per worker, in the worker's own browser.
let webgpu = false
test.beforeAll(async ({ browser }, testInfo) => {
  webgpu = await probeWebGPU(browser, testInfo.project.use.baseURL!)
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
  // fails if the WebGPU renderer never started, not just if a canvas exists.
  const canvas = page.locator(WEBGPU_CANVAS)
  await expect(canvas).toHaveCount(1, { timeout: 60_000 })

  await page.waitForLoadState('networkidle')
  await expect(page.locator('.loading__container')).toHaveCount(0, { timeout: 60_000 })

  // The scenes render on WebGPU only. The canvas has no 'webgpu' context if
  // three fell back to WebGL2, and a WebGPU context has no "lost" state to
  // ask about, unlike WebGL's isContextLost.
  return canvas.evaluate((el: HTMLCanvasElement) => ({
    width: el.width,
    height: el.height,
    hasContext: el.getContext('webgpu') !== null,
  }))
}

for (const clock of CLOCKS) {
  test.describe(clock.name, () => {
    for (const route of ROUTES) {
      test(`${route} mounts with a live canvas and no errors`, async ({ page }) => {
        test.skip(!clock.runs.includes(route), 'cut back to the routes with a scene; see CLOCKS')
        test.skip(!webgpu, NO_ADAPTER)
        const errors = watchErrors(page)
        // index.html loads the Adobe Fonts (Typekit) stylesheet. Fonts aren't
        // what this test checks, so a slow or failed third-party download
        // mustn't fail it. See H3N-76.
        await page.route('https://use.typekit.net/**', (r) =>
          r.fulfill({ status: 200, contentType: 'text/css', body: '' }),
        )
        await page.clock.install({ time: new Date(clock.time) })
        await page.goto(route)

        const gl = await Promise.race([waitUntilReady(page), errors.firstUncaught])
        expect(gl.width).toBeGreaterThan(0)
        expect(gl.height).toBeGreaterThan(0)
        expect(gl.hasContext).toBe(true)

        await Promise.race([page.waitForTimeout(SETTLE_MS), errors.firstUncaught])
        expect(errors.unexpected()).toEqual([])
      })
    }
  })
}
