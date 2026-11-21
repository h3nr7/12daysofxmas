// After the visitor orbits or zooms the camera, the next scene change glides
// the camera from where the visitor left it. It must not jump back to where
// the camera was before the drag first (H3N-72).

import { expect, test, type Page } from '@playwright/test'

type Vec3 = [number, number, number]
type Sample = { t: number; p: Vec3 }

declare global {
  interface Window {
    __camera?: { position: { x: number; y: number; z: number } }
    __samples?: Sample[]
  }
}

test.describe.configure({ timeout: 120_000 })

const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

// three.js announces every renderer it creates to window.__THREE_DEVTOOLS__
// when that exists. Use it to find the camera the app renders with: the one
// inside the camera rig, so a parentless camera, such as the one that bakes
// the environment map, is skipped.
async function hookCamera(page: Page) {
  await page.addInitScript(() => {
    type Cam = { isPerspectiveCamera?: boolean; parent?: unknown; position: { x: number; y: number; z: number } }
    type Renderer = { isWebGLRenderer?: boolean; render: (scene: unknown, camera: Cam) => void }
    const devtools = new EventTarget()
    Object.assign(window, { __THREE_DEVTOOLS__: devtools })
    devtools.addEventListener('observe', (e) => {
      const renderer = (e as CustomEvent<Renderer>).detail
      if (!renderer?.isWebGLRenderer) return
      const render = renderer.render.bind(renderer)
      renderer.render = (scene, camera) => {
        if (camera.isPerspectiveCamera && camera.parent) window.__camera = camera
        render(scene, camera)
      }
    })
  })
}

// The camera's position inside the rig, the group that moves to each
// scene's look-at point. This is what the visitor's orbit changes, and what
// jumped back with the bug.
const cameraPosition = (page: Page) =>
  page.evaluate(() => {
    const p = window.__camera?.position
    return p ? ([p.x, p.y, p.z] as Vec3) : null
  })

// Waits until the camera has stopped moving for a second.
async function waitForCameraToSettle(page: Page): Promise<Vec3> {
  let last = await cameraPosition(page)
  let stillSince = Date.now()
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    await page.waitForTimeout(250)
    const now = await cameraPosition(page)
    if (!now || !last || distance(now, last) > 1e-3) stillSince = Date.now()
    else if (Date.now() - stillSince >= 1000) return now
    last = now
  }
  throw new Error('the camera never settled')
}

// Records the camera's position inside the rig on every animation frame.
const startSampling = (page: Page) =>
  page.evaluate(() => {
    const samples: Sample[] = []
    window.__samples = samples
    const t0 = performance.now()
    const tick = () => {
      const p = window.__camera?.position
      if (p) samples.push({ t: performance.now() - t0, p: [p.x, p.y, p.z] })
      if (window.__samples === samples) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

const stopSampling = (page: Page) =>
  page.evaluate(() => {
    const samples = window.__samples ?? []
    window.__samples = undefined
    return samples
  })

// React Router's BrowserRouter follows popstate.
const navigateInApp = (page: Page, to: string) =>
  page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, to)

// Both scenes have their own viewpoint, so the camera glides to it.
for (const to of ['/first', '/fifth']) {
  test(`after an orbit, going to ${to} glides the camera from where the visitor left it`, async ({ page }) => {
    await hookCamera(page)
    // Fonts aren't what this test checks. See H3N-76.
    await page.route('https://use.typekit.net/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }))
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const beforeDrag = await waitForCameraToSettle(page)

    // Orbit a quarter turn by dragging across the middle of the scene
    // (camera-controls turns 2π per viewport height dragged).
    const { width, height } = page.viewportSize()!
    const dragPx = height / 4
    await page.mouse.move(width * 0.7, height * 0.6)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) await page.mouse.move(width * 0.7 - (i * dragPx) / 20, height * 0.6, { steps: 2 })
    await page.mouse.up()
    const afterDrag = await waitForCameraToSettle(page)
    const orbited = distance(beforeDrag, afterDrag)
    expect(orbited, 'the drag should orbit the camera').toBeGreaterThan(0.5)

    await startSampling(page)
    await navigateInApp(page, to)
    // Wait for the glide to start. With software rendering the scene's models
    // load slowly, and the scene sets its viewpoint once they have.
    const firstMove = (samples: Sample[]) => samples.find((s) => distance(s.p, afterDrag) > 1e-2)
    await expect
      .poll(async () => !!firstMove(await page.evaluate(() => window.__samples ?? [])), { timeout: 45_000 })
      .toBe(true)
    const samples = await stopSampling(page)
    const firstMoved = firstMove(samples)!
    const path = JSON.stringify(samples.map((s) => [Math.round(s.t), ...s.p.map((v) => +v.toFixed(2))]))

    // A glide leaves from where the visitor left the camera. With the bug the
    // camera jumped back to where it was before the drag and glided from
    // there. At a few frames a second the first frame of a glide can already
    // be some way along it, so this checks where that frame is, not how far
    // it moved.
    expect(
      distance(firstMoved.p, beforeDrag),
      `first camera position after the scene change, from where it was before the drag; path ${path}`,
    ).toBeGreaterThan(orbited * 0.2)
  })
}
