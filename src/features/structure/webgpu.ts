/**
 * WebGPU capability probe. The on-device LLM needs a real GPU adapter, so we
 * check for one before offering it. Cached after the first successful probe.
 */
let cached: boolean | undefined

interface MinimalGPU {
  requestAdapter(): Promise<unknown>
}

export async function isWebGPUAvailable(): Promise<boolean> {
  if (cached !== undefined) return cached
  const gpu = (navigator as Navigator & { gpu?: MinimalGPU }).gpu
  if (!gpu) return (cached = false)
  try {
    const adapter = await gpu.requestAdapter()
    cached = adapter != null
  } catch {
    cached = false
  }
  return cached
}

/** Reset the cache (used in tests). */
export function resetWebGPUCache(): void {
  cached = undefined
}
