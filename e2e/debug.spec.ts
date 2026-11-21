// Debug mode: `?debug` (and `&date=`) in the URL, carried from page to page
// by the site's own links (H3N-78).

import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })

test.beforeEach(async ({ page }) => {
  // Fonts aren't what this checks; see smoke.spec.ts and H3N-76.
  await page.route('https://use.typekit.net/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  )
})

async function open(page: Page, time: string, url: string) {
  await page.clock.install({ time: new Date(time) })
  await page.goto(url)
}

const homeButton = (page: Page) => page.locator('.zero__ui button')
const back = (page: Page) => page.locator('.navi h3')

test.describe('navigation carries debug (H3N-79)', () => {
  // Day 3 of Christmas, so the home button is enabled and goes to /third.
  const DAY_3 = '2026-12-27T12:00:00'

  test('from /?debug, the home button and *Bk keep ?debug', async ({ page }) => {
    await open(page, DAY_3, '/?debug')
    await homeButton(page).click()
    await expect(page).toHaveURL('/third?debug')
    await back(page).click()
    await expect(page).toHaveURL('/?debug')
  })

  test('from /, the same walk adds no params', async ({ page }) => {
    await open(page, DAY_3, '/')
    await homeButton(page).click()
    await expect(page).toHaveURL('/third')
    await back(page).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('the fake date (H3N-80)', () => {
  // Before December, so any Christmas state on screen comes from date=.
  const NOV_21 = '2026-11-21T12:00:00'

  test('date=2026-12-27 is day 3, and the date travels with debug', async ({ page }) => {
    await open(page, NOV_21, '/?debug&date=2026-12-27')
    await expect(homeButton(page)).toHaveText('Day 3 awaits')
    await expect(homeButton(page)).toBeEnabled()
    await homeButton(page).click()
    await expect(page).toHaveURL('/third?debug&date=2026-12-27')
    await back(page).click()
    await expect(page).toHaveURL('/?debug&date=2026-12-27')
  })

  test('date=2026-12-01 shows the countdown from that date', async ({ page }) => {
    await open(page, NOV_21, '/?debug&date=2026-12-01')
    await expect(page.locator('.zero__ui h3')).toContainText('23D')
  })

  for (const url of ['/?date=2026-12-27', '/?debug&date=2026-13-40']) {
    test(`${url} keeps the real date`, async ({ page }) => {
      await open(page, NOV_21, url)
      await expect(homeButton(page)).toBeDisabled()
      await expect(homeButton(page)).not.toHaveText('Day 3 awaits')
    })
  }
})

test.describe('overlays and the Begin here link (H3N-81)', () => {
  const NOV_21 = '2026-11-21T12:00:00'
  const stats = (page: Page) => page.locator('.debug-stats')
  const beginHere = (page: Page) => page.getByRole('link', { name: 'Begin here...' })

  test('/?debug&date=2026-12-27 shows Stats and Begin here, which keeps debug', async ({ page }) => {
    await open(page, NOV_21, '/?debug&date=2026-12-27')
    await expect(stats(page)).toBeVisible()
    await expect(beginHere(page)).toBeVisible()
    await beginHere(page).click()
    await expect(page).toHaveURL('/first?debug&date=2026-12-27')
  })

  test('Stats stays on after moving to a day page', async ({ page }) => {
    await open(page, NOV_21, '/?debug&date=2026-12-27')
    await homeButton(page).click()
    await expect(page).toHaveURL('/third?debug&date=2026-12-27')
    await expect(stats(page)).toBeVisible()
  })

  test('/?debug shows Stats and Begin here on the real date, with no page errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await open(page, NOV_21, '/?debug')
    await expect(stats(page)).toBeVisible()
    await expect(beginHere(page)).toBeVisible()
    await expect(homeButton(page)).toBeDisabled()
    expect(errors).toEqual([])
  })

  // The scene behind this page mounts only with WebGPU, which the test
  // browser does not have until H3N-98 (see H3N-59), so this waits for the
  // page to settle rather than for a canvas.
  test('/eighth?debug keeps Stats once the page has settled', async ({ page }) => {
    await open(page, NOV_21, '/eighth?debug')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await expect(stats(page)).toBeVisible()
  })

  test('/ shows neither Stats nor Begin here', async ({ page }) => {
    await open(page, NOV_21, '/')
    await expect(homeButton(page)).toBeVisible()
    await page.waitForTimeout(4000) // past the link's 3s enter delay
    await expect(stats(page)).toHaveCount(0)
    await expect(beginHere(page)).toHaveCount(0)
  })
})
