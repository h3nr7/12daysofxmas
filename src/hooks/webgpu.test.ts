import { describe, expect, it } from 'vitest'
import { supportsWebGPU } from './webgpu'

describe('supportsWebGPU', () => {
  it('is false without navigator.gpu', async () => {
    expect(await supportsWebGPU({})).toBe(false)
  })

  it('is false when no adapter is given', async () => {
    expect(await supportsWebGPU({ gpu: { requestAdapter: async () => null } })).toBe(false)
  })

  it('is true when an adapter is given', async () => {
    expect(await supportsWebGPU({ gpu: { requestAdapter: async () => ({}) } })).toBe(true)
  })

  it('is false when asking throws', async () => {
    const gpu = { requestAdapter: async () => { throw new Error('no GPU') } }
    expect(await supportsWebGPU({ gpu })).toBe(false)
  })
})
