import { createContext, useContext } from 'react'
import type { Structurer } from './types'
import type { LoadState, ProgressInfo } from './webllm/engine'

export interface AIState {
  /** WebGPU support: undefined while probing. */
  supported: boolean | undefined
  enabled: boolean
  modelId: string
  loadState: LoadState
  progress: ProgressInfo | null
  error: string | null
}

export interface StructurerContextValue {
  /** The engine the app structures with right now. */
  active: Structurer
  ai: AIState
  /** Download + switch to the on-device model. */
  enableAI: (modelId: string) => Promise<void>
  /** Fall back to the built-in heuristic parser. */
  disableAI: () => void
}

export const StructurerContext = createContext<StructurerContextValue | null>(null)

export function useStructurer(): StructurerContextValue {
  const ctx = useContext(StructurerContext)
  if (!ctx) throw new Error('useStructurer must be used within <StructurerProvider>')
  return ctx
}
