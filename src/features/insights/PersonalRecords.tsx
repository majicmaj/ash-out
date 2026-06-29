import { useWeightUnit } from '@/features/settings/weightUnit'
import type { ExerciseRecord } from './records'

const fmt = (n: number) => Number(n.toFixed(1)).toLocaleString()

/**
 * Per-exercise strength progress: best set, estimated 1-RM, and best session
 * volume, with a "New PR" badge when a best was set in the selected window.
 * Complements the set-count views, which can't show progression.
 */
export function PersonalRecords({ records }: { records: ExerciseRecord[] }) {
  const unit = useWeightUnit()
  if (records.length === 0) return null

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Personal records</h3>
      <ul className="space-y-2">
        {records.map((r) => {
          const parts = [
            r.bestReps > 0
              ? `${fmt(r.bestWeightKg)} ${unit} × ${r.bestReps}`
              : `${fmt(r.bestWeightKg)} ${unit}`,
          ]
          if (r.est1RM > 0) parts.push(`1RM ~${fmt(r.est1RM)} ${unit}`)
          if (r.bestVolumeKg > 0) parts.push(`${fmt(r.bestVolumeKg)} ${unit} vol`)
          return (
            <li key={r.exercise} className="rounded-lg bg-slate-800/40 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate capitalize text-slate-200">{r.exercise}</span>
                {r.prInWindow && (
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    ★ New PR
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs tabular-nums text-slate-500">{parts.join('  ·  ')}</div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
