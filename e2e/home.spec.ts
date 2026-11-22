// The home page shows the "12 days of Xmas" title once, all year round.
// Outside December and January it used to show it twice (H3N-77).

import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })

const TITLE = /12\s+days\s+of\s+Xmas/

test.beforeEach(async ({ page }) => {
  // Fonts aren't what this checks; see smoke.spec.ts and H3N-76.
  await page.route('https://use.typekit.net/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  )
})

test('before December, / shows the title once', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-21T12:00:00') })
  await page.goto('/')

  const titles = page.locator('h1')
  await expect(titles).toHaveCount(1)
  // innerText keeps the line break between "days" and "of".
  await expect(titles).toHaveText(TITLE, { useInnerText: true })
})

// The vertical gap in px from the bottom of `above` to the top of `below`.
async function gap(page: Page, above: string, below: string) {
  const a = await page.locator(above).boundingBox()
  const b = await page.locator(below).boundingBox()
  if (!a || !b) throw new Error(`no box for ${a ? below : above}`)
  return Math.round(b.y - (a.y + a.height))
}

// The button slides down 15px as it fades in (about 2.7s after load), and
// bounding boxes include that transform, so gaps are polled until it settles.
const SETTLED = { timeout: 15_000 }

// The button sits 2rem (32px) below the text above it, as it does under the
// countdown in December. On a phone the button is fixed to the bottom of the
// screen instead, so this is checked at the desktop viewport only.
test('before December, the button sits 2rem below the title', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-21T12:00:00') })
  await page.goto('/')

  await expect.poll(() => gap(page, '.zero__ui h1', '.zero__ui button'), SETTLED).toBe(32)
})

test('in December, the countdown and button keep their spacing', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-01T12:00:00') })
  await page.goto('/')

  await expect.poll(() => gap(page, '.zero__ui h3', '.zero__ui button'), SETTLED).toBe(32)
  expect(await gap(page, '.zero__ui h1', '.zero__ui h3')).toBe(0)
})

test('in December, / shows the title once, with the countdown under it', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-01T12:00:00') })
  await page.goto('/')

  const titles = page.locator('h1')
  await expect(titles).toHaveCount(1)
  await expect(titles).toHaveText(TITLE, { useInnerText: true })
  await expect(page.locator('.zero__ui h3')).toContainText(/\d+D/)
})

// The scenes need WebGPU, with no fallback (H3N-59): without it the home
// page says so in one line and no canvas is mounted.
test('without WebGPU, / shows the note and no canvas', async ({ page }) => {
  // navigator.gpu is a getter on the prototype, so it is removed there.
  await page.addInitScript(() => Reflect.deleteProperty(Navigator.prototype, 'gpu'))
  await page.clock.install({ time: new Date('2026-12-27T12:00:00') })
  await page.goto('/')

  await expect(page.locator('h6.zero__webgpu')).toContainText('WebGPU')
  await expect(page.locator('canvas')).toHaveCount(0)
})
