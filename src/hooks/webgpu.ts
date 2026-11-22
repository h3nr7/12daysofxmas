import { useEffect, useState } from 'react'

// The scenes render on three's WebGPURenderer and nothing else: without
// WebGPU the canvas is not mounted and the home page says so in one line
// (ZeroUI.tsx). Design: docs/plans/2026-11-21-webgpu-design.md

/** The part of `navigator` the check reads, so a test can hand in its own. */
export interface GPUNavigator {
  gpu?: {
    requestAdapter(): Promise<{ requestDevice(): Promise<{ destroy(): void }> } | null>
  }
}

/**
 * Whether `nav` can give a WebGPU device. A browser may have `navigator.gpu`
 * and still return no adapter (no usable GPU, a blocklist), or an adapter that
 * cannot create a device (Chromium's headless shell on Windows); both are a
 * no. The adapter alone is not enough: three's WebGPURenderer would then fall
 * back to WebGL2 with only a warning, and this project renders on WebGPU only.
 * The device is released straight away; the renderer asks for its own.
 */
export async function supportsWebGPU(nav: GPUNavigator): Promise<boolean> {
  if (!nav.gpu) return false
  try {
    const adapter = await nav.gpu.requestAdapter()
    if (!adapter) return false
    const device = await adapter.requestDevice()
    device.destroy()
    return true
  } catch {
    return false
  }
}

export type WebGPUSupport = 'checking' | 'yes' | 'no'

/**
 * A check that asks `nav` once and hands every caller the same answer. App
 * and ZeroUI both need the answer, and ZeroUI remounts on every visit to
 * `/`; without this each would make its own device, and could disagree.
 */
export function onceForPage(nav: GPUNavigator): () => Promise<boolean> {
  let answer: Promise<boolean> | undefined
  return () => (answer ??= supportsWebGPU(nav))
}

let pageCheck: (() => Promise<boolean>) | undefined
let known: WebGPUSupport = 'checking'

/** The page's one check; 'checking' until it answers, then the answer. */
export function useWebGPUSupport(): WebGPUSupport {
  const [support, setSupport] = useState<WebGPUSupport>(known)
  useEffect(() => {
    let cancelled = false
    pageCheck ??= onceForPage(navigator)
    pageCheck().then((yes) => {
      known = yes ? 'yes' : 'no'
      if (!cancelled) setSupport(known)
    })
    return () => { cancelled = true }
  }, [])
  return support
}
