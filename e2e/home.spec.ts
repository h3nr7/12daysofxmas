// The home page shows the "12 days of Xmas" title once, all year round.
// Outside December and January it used to show it twice (H3N-77).

import { expect, test } from '@playwright/test'

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

test('in December, / shows the title once, with the countdown under it', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-01T12:00:00') })
  await page.goto('/')

  const titles = page.locator('h1')
  await expect(titles).toHaveCount(1)
  await expect(titles).toHaveText(TITLE, { useInnerText: true })
  await expect(page.locator('.zero__ui h3')).toContainText(/\d+D/)
})
