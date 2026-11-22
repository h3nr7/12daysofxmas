// Shared browser settings and WebGPU checks for the capture script and the
// Playwright tests.

import type { Browser, Page } from '@playwright/test'

// The scenes render on WebGPU only (H3N-59). Playwright's default headless
// shell gives no usable WebGPU (on Windows its adapter fails to create a
// device: no dxcompiler.dll); its full Chromium in headless mode does, with
// the flags below. PW_CHANNEL=chromium-headless-shell runs the tests on the
// shell instead, to see the scene routes skip with the reason.
export const CHANNEL = process.env.PW_CHANNEL ?? 'chromium'

// Chromium flags that turn WebGPU on in headless mode. On Windows it runs
// on the GPU through Direct3D 11; elsewhere through Vulkan, which gives no
// adapter on Windows.
export const LAUNCH_ARGS =
  process.platform === 'win32'
    ? ['--enable-unsafe-webgpu', '--use-angle=d3d11', '--ignore-gpu-blocklist']
    : ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan', '--ignore-gpu-blocklist']

export const VIEWPORT = { width: 1280, height: 800 }

// A test that needs a scene skips with this when hasWebGPU says no.
export const NO_ADAPTER = 'no WebGPU adapter in this browser; see H3N-59'

// three.js marks the canvas of a started WebGPURenderer with data-engine
// "three.js r187 webgpu". It does so on its WebGL2 fallback backend too, so
// only the canvas's 'webgpu' context says the scene is really on WebGPU.
export const WEBGPU_CANVAS = 'canvas[data-engine*="webgpu"]'

/**
 * Whether the page's browser gives a WebGPU adapter that can create a
 * device. An adapter that cannot counts as none: three would quietly fall
 * back to WebGL2 on it.
 */
export function hasWebGPU(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    try {
      const adapter = await navigator.gpu?.requestAdapter()
      if (!adapter) return false
      const device = await adapter.requestDevice()
      device.destroy()
      return true
    } catch {
      return false
    }
  })
}

/**
 * Asks `browser` for WebGPU (see hasWebGPU) from an empty page on `baseURL`.
 * navigator.gpu exists only in secure contexts, which about:blank is not
 * and localhost is, so the page is served on the test origin, but by the
 * test itself, so the app plays no part in the answer.
 */
export async function probeWebGPU(browser: Browser, baseURL: string): Promise<boolean> {
  const page = await browser.newPage({ baseURL })
  try {
    await page.route('**/__webgpu-probe', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html>' }))
    await page.goto('/__webgpu-probe')
    return await hasWebGPU(page)
  } finally {
    await page.close()
  }
}
