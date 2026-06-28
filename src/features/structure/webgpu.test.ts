import { describe, it, expect, afterEach, vi } from 'vitest'
import { isWebGPUAvailable, resetWebGPUCache } from './webgpu'

afterEach(() => {
  resetWebGPUCache()
  vi.unstubAllGlobals()
})

describe('isWebGPUAvailable', () => {
  it('is false when navigator.gpu is absent', async () => {
    expect(await isWebGPUAvailable()).toBe(false)
  })

  it('is true when an adapter is returned', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      gpu: { requestAdapter: () => Promise.resolve({}) },
    })
    expect(await isWebGPUAvailable()).toBe(true)
    vi.unstubAllGlobals()
  })

  it('is false when no adapter is available', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      gpu: { requestAdapter: () => Promise.resolve(null) },
    })
    expect(await isWebGPUAvailable()).toBe(false)
    vi.unstubAllGlobals()
  })
})
