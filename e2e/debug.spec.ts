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
