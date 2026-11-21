import { useEffect, useState } from 'react'

// The scenes render on three's WebGPURenderer and nothing else: without
// WebGPU the canvas is not mounted and the home page says so in one line
// (ZeroUI.tsx). Design: docs/plans/2026-11-21-webgpu-design.md

/** The part of `navigator` the check reads, so a test can hand in its own. */
export interface GPUNavigator {
  gpu?: { requestAdapter(): Promise<unknown> }
}

/**
 * Whether `nav` can give a WebGPU adapter. A browser may have `navigator.gpu`
 * and still return no adapter (no usable GPU, a blocklist), which is a no.
 */
export async function supportsWebGPU(nav: GPUNavigator): Promise<boolean> {
  if (!nav.gpu) return false
  try {
    return (await nav.gpu.requestAdapter()) !== null
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
