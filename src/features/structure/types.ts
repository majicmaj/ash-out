import type { StructuredEvent } from '@/db/types'

/**
 * A pluggable engine that turns a raw log into structured events. Step 2 ships
 * two: a free, instant heuristic parser (default) and an optional on-device LLM.
 * Both satisfy this interface so the orchestration and UI never care which ran.
 */
export interface Structurer {
  /** Stable id stored on the log as `modelId` (e.g. 'heuristic', 'webllm:Qwen…'). */
  readonly id: string
  /** Human label for settings/UI. */
  readonly label: string
  /** Whether this engine can run right now (e.g. WebGPU present, model loaded). */
  isAvailable(): Promise<boolean>
  /** Convert raw text into zero or more structured events. */
  structure(rawText: string): Promise<StructuredEvent[]>
}

export type { StructuredEvent }
