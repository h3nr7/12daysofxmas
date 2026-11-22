import { describe, expect, it } from 'vitest'
import { onceForPage, supportsWebGPU } from './webgpu'

/** An adapter whose device request resolves; `destroyed` records the release. */
function adapterWithDevice() {
  const state = { destroyed: false }
  const adapter = { requestDevice: async () => ({ destroy: () => { state.destroyed = true } }) }
  return { adapter, state }
}

describe('supportsWebGPU', () => {
  it('is false without navigator.gpu', async () => {
    expect(await supportsWebGPU({})).toBe(false)
  })

  it('is false when no adapter is given', async () => {
    expect(await supportsWebGPU({ gpu: { requestAdapter: async () => null } })).toBe(false)
  })

  it('is true when the adapter gives a device, and releases the device', async () => {
    const { adapter, state } = adapterWithDevice()
    expect(await supportsWebGPU({ gpu: { requestAdapter: async () => adapter } })).toBe(true)
    expect(state.destroyed).toBe(true)
  })

  it('is false when the adapter cannot give a device', async () => {
    // Seen in Chromium's headless shell on Windows: an adapter, then
    // requestDevice() rejects, and three would quietly render on WebGL2.
    const adapter = { requestDevice: async () => { throw new Error('dxcompiler.dll') } }
    expect(await supportsWebGPU({ gpu: { requestAdapter: async () => adapter } })).toBe(false)
  })

  it('is false when asking for an adapter throws', async () => {
    const gpu = { requestAdapter: async () => { throw new Error('no GPU') } }
    expect(await supportsWebGPU({ gpu })).toBe(false)
  })
})

describe('onceForPage', () => {
  it('asks the browser once and gives every caller the same answer', async () => {
    let asked = 0
    const { adapter } = adapterWithDevice()
    const check = onceForPage({ gpu: { requestAdapter: async () => { asked += 1; return adapter } } })
    const [a, b] = await Promise.all([check(), check()])
    expect(await check()).toBe(true)
    expect([a, b]).toEqual([true, true])
    expect(asked).toBe(1)
  })
})
