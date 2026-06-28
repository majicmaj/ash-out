import { Button } from '@/components/Button'
import { useStructurer } from './structurerContext'
import { MODELS } from './webllm/models'

/**
 * On-device AI controls. The heuristic parser always runs; here the user can
 * upgrade to a local LLM for richer extraction. Everything stays on-device —
 * the model is downloaded once and cached by the browser.
 */
export function AISettings() {
  const { ai, enableAI, disableAI } = useStructurer()
  const loading = ai.loadState === 'loading'
  const ready = ai.enabled && ai.loadState === 'ready'

  return (
    <div className="mt-5 rounded-xl border border-slate-700 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-200">On-device AI</p>
        {ready && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
            On
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Richer parsing with a local model. Free, private, runs on your GPU.
      </p>

      {ai.supported === false && (
        <p className="mt-3 text-sm text-slate-400">
          This browser/device doesn’t support WebGPU, so the built-in parser stays on. Try a recent
          Chrome, Edge, or Safari.
        </p>
      )}

      {ai.supported && (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs text-slate-500">Model</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 disabled:opacity-50"
              value={ai.modelId}
              disabled={loading || ready}
              onChange={(e) => void enableAI(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.sizeLabel})
                </option>
              ))}
            </select>
          </label>

          {loading && ai.progress && (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.round(ai.progress.progress * 100)}%` }}
                />
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{ai.progress.text}</p>
            </div>
          )}

          {ai.error && <p className="text-sm text-red-400">{ai.error}</p>}

          {ready ? (
            <Button size="sm" variant="ghost" onClick={disableAI}>
              Switch back to built-in parser
            </Button>
          ) : (
            !loading && (
              <Button size="sm" onClick={() => void enableAI(ai.modelId)}>
                Download &amp; enable
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
