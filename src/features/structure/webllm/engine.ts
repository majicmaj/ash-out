import type { StructuredEvent } from '@/db/types'
import type { Structurer } from '../types'
import { isWebGPUAvailable } from '../webgpu'
import { EVENTS_SCHEMA_JSON } from './schema'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt'
import { parseModelEvents } from './normalize'
import { modelLabel } from './models'

/**
 * On-device LLM engine (WebLLM + WebGPU). Heavy and network-fetched, so it is
 * dynamically imported and only the user opts into it. The model is loaded once
 * and reused; structuring uses grammar-constrained JSON output (see schema.ts)
 * and the result is run through the defensive normalizer.
 */

export type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export interface ProgressInfo {
  text: string
  progress: number
}

// Minimal shape we rely on, to avoid coupling to WebLLM's full type surface.
interface MLCEngine {
  chat: {
    completions: {
      create: (req: unknown) => Promise<{ choices: { message?: { content?: string } }[] }>
    }
  }
}

let engine: MLCEngine | null = null
let loadedModelId: string | null = null

export function isModelLoaded(modelId: string): boolean {
  return engine !== null && loadedModelId === modelId
}

export async function loadModel(
  modelId: string,
  onProgress?: (p: ProgressInfo) => void,
): Promise<void> {
  if (isModelLoaded(modelId)) return
  const webllm = await import('@mlc-ai/web-llm')
  engine = (await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (r: ProgressInfo) => onProgress?.({ text: r.text, progress: r.progress }),
  })) as unknown as MLCEngine
  loadedModelId = modelId
}

async function structure(rawText: string): Promise<StructuredEvent[]> {
  if (!engine) throw new Error('On-device model is not loaded')
  const reply = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(rawText) },
    ],
    response_format: { type: 'json_object', schema: EVENTS_SCHEMA_JSON },
    temperature: 0,
  })
  return parseModelEvents(reply.choices[0]?.message?.content ?? '')
}

/** A Structurer bound to a specific model; available only once loaded. */
export function createWebLLMStructurer(modelId: string): Structurer {
  return {
    id: `webllm:${modelId}`,
    label: `On-device AI · ${modelLabel(modelId)}`,
    isAvailable: async () => (await isWebGPUAvailable()) && isModelLoaded(modelId),
    structure,
  }
}
