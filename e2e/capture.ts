// Records each mounted scene entering and exiting, for comparing the app
// before and after an upgrade by eye.
//
//   pnpm capture before   -> captures/before/
//   pnpm capture after    -> captures/after/
//
// Per scene it writes a video (<scene>.webm), still frames at fixed times
// (<scene>/enter-<ms>.png, <scene>/exit-<ms>.png) and a log of console
// errors and the WebGL renderer (<scene>/log.json).

import { build, preview } from 'vite'
import { chromium, type Page } from '@playwright/test'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { LAUNCH_ARGS, VIEWPORT } from './browser.ts'

// Captures should play at a real frame rate. Software WebGL (SwiftShader)
// runs these scenes at about 2 fps, and react-spring caps each frame's step
// at 64 ms, so its animations would crawl. On Windows, use the GPU through
// Direct3D; elsewhere fall back to the shared flags. log.json records which
// renderer was used.
const CAPTURE_ARGS =
  process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : LAUNCH_ARGS

const PORT = 4174
const BASE_URL = `http://localhost:${PORT}`

// Each scene is entered and left by in-app navigation, so both its enter
// and exit animations play with assets already loaded. '/fourth' mounts no
// 3D scene today but loads every asset, so it is the starting point, and
// the root scene's exit is seen on its own.
const STAGING_PATH = '/fourth'

// `exitTo` is where the scene is left for.
const SCENES = [
  { name: 'root', path: '/', exitTo: '/fourth' },
  { name: 'first', path: '/first', exitTo: '/' },
  { name: 'fifth', path: '/fifth', exitTo: '/' },
  { name: 'eighth', path: '/eighth', exitTo: '/' },
  { name: 'sandbox', path: '/sandbox', exitTo: '/' },
]

const ENTER_FRAMES_MS = [0, 1000, 2000, 3500, 5000, 7000]
const EXIT_FRAMES_MS = [0, 500, 1500, 3000, 5000]

const label = process.argv[2]
if (!label || !/^[a-z0-9-]+$/i.test(label)) {
  console.error('Usage: pnpm capture <label>   (for example: pnpm capture before)')
  process.exit(1)
}
const outDir = path.resolve('captures', label)

// In-app navigation without a page reload, so exit animations play.
// React Router's BrowserRouter follows popstate.
async function navigateInApp(page: Page, to: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, to)
}

async function waitForLoaded(page: Page) {
  await page.waitForSelector('canvas', { timeout: 60_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 })
  await page.waitForFunction(() => !document.querySelector('.loading__container'), null, {
    timeout: 60_000,
  })
}

async function framesAt(page: Page, dir: string, prefix: string, times: number[]) {
  const start = Date.now()
  for (const ms of times) {
    const wait = start + ms - Date.now()
    if (wait > 0) await page.waitForTimeout(wait)
    await page.screenshot({ path: path.join(dir, `${prefix}-${String(ms).padStart(4, '0')}.png`) })
  }
}

async function main() {
  console.log('Building...')
  await build({ logLevel: 'warn' })
  const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'warn' })

  // Empty the folder rather than delete it, so an open folder doesn't block a run.
  await mkdir(outDir, { recursive: true })
  for (const entry of await readdir(outDir)) {
    await rm(path.join(outDir, entry), { recursive: true, force: true })
  }
  const browser = await chromium.launch({ args: CAPTURE_ARGS })

  try {
    for (const scene of SCENES) {
      console.log(`Capturing ${scene.path}`)
      const sceneDir = path.join(outDir, scene.name)
      await mkdir(sceneDir, { recursive: true })

      const context = await browser.newContext({
        viewport: VIEWPORT,
        recordVideo: { dir: path.join(outDir, '.video-tmp'), size: VIEWPORT },
      })
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
      })

      await page.goto(BASE_URL + STAGING_PATH)
      await waitForLoaded(page)
      await page.waitForTimeout(1000)
      const renderer = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2')
        if (!gl) return 'no webgl2'
        const info = gl.getExtension('WEBGL_debug_renderer_info')
        return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
      })

      await navigateInApp(page, scene.path)
      await framesAt(page, sceneDir, 'enter', ENTER_FRAMES_MS)
      await navigateInApp(page, scene.exitTo)
      await framesAt(page, sceneDir, 'exit', EXIT_FRAMES_MS)

      const video = page.video()
      await context.close()
      await video?.saveAs(path.join(outDir, `${scene.name}.webm`))
      await video?.delete()

      await writeFile(
        path.join(sceneDir, 'log.json'),
        JSON.stringify(
          { startAt: STAGING_PATH, path: scene.path, exitTo: scene.exitTo, renderer, errors },
          null,
          2,
        ),
      )
    }
  } finally {
    await browser.close()
    await rm(path.join(outDir, '.video-tmp'), { recursive: true, force: true })
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()))
  }
  console.log(`Done: ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
