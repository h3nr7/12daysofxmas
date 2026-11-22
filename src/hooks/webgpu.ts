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

/** Runs the check once on mount; 'checking' until it answers. */
export function useWebGPUSupport(): WebGPUSupport {
  const [support, setSupport] = useState<WebGPUSupport>('checking')
  useEffect(() => {
    let cancelled = false
    supportsWebGPU(navigator).then((yes) => {
      if (!cancelled) setSupport(yes ? 'yes' : 'no')
    })
    return () => { cancelled = true }
  }, [])
  return support
}
