import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { heuristicStructurer } from './heuristic'
import { isWebGPUAvailable } from './webgpu'
import {
  createWebLLMStructurer,
  loadModel,
  type LoadState,
  type ProgressInfo,
} from './webllm/engine'
import { DEFAULT_MODEL_ID } from './webllm/models'
import { StructurerContext, type AIState } from './structurerContext'

const LS_ENABLED = 'ashout.ai.enabled'
const LS_MODEL = 'ashout.ai.model'

/**
 * Owns engine selection. Defaults to the free heuristic parser; the user can
 * opt into the on-device LLM, which is downloaded on demand and persisted so it
 * re-loads automatically next visit. The chosen engine is exposed to the rest
 * of the app via context.
 */
export function StructurerProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState<boolean | undefined>(undefined)
  const [enabled, setEnabled] = useState(false)
  const [modelId, setModelId] = useState(() => localStorage.getItem(LS_MODEL) ?? DEFAULT_MODEL_ID)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enableAI = useCallback(async (id: string) => {
    setError(null)
    setModelId(id)
    setLoadState('loading')
    try {
      await loadModel(id, setProgress)
      localStorage.setItem(LS_ENABLED, 'true')
      localStorage.setItem(LS_MODEL, id)
      setEnabled(true)
      setLoadState('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the model.')
      setLoadState('error')
      setEnabled(false)
    }
  }, [])

  const disableAI = useCallback(() => {
    localStorage.setItem(LS_ENABLED, 'false')
    setEnabled(false)
    setLoadState('idle')
    setProgress(null)
  }, [])

  // Probe WebGPU once, then resume a previously-enabled model automatically.
  useEffect(() => {
    let cancelled = false
    void isWebGPUAvailable().then((ok) => {
      if (cancelled) return
      setSupported(ok)
      if (ok && localStorage.getItem(LS_ENABLED) === 'true') {
        void enableAI(localStorage.getItem(LS_MODEL) ?? DEFAULT_MODEL_ID)
      }
    })
    return () => {
      cancelled = true
    }
  }, [enableAI])

  const value = useMemo(() => {
    const active =
      enabled && loadState === 'ready' ? createWebLLMStructurer(modelId) : heuristicStructurer
    const ai: AIState = { supported, enabled, modelId, loadState, progress, error }
    return { active, ai, enableAI, disableAI }
  }, [enabled, loadState, modelId, supported, progress, error, enableAI, disableAI])

  return <StructurerContext.Provider value={value}>{children}</StructurerContext.Provider>
}
