import { cn } from '@/lib/cn'
import { targetFor, type MuscleStat } from './aggregate'

export type MuscleMetric = 'count' | 'target'

/**
 * The per-muscle-group breakdown, in one of two views:
 *  - `count`: ranked by sets trained (raw training volume).
 *  - `target`: each group against its appropriate weekly set target, so the
 *    chart reads as progress toward a goal. Bars turn green once a group is in
 *    its recommended range.
 */
export function MuscleLeaderboard({
  muscles,
  metric,
}: {
  muscles: MuscleStat[]
  metric: MuscleMetric
}) {
  if (muscles.length === 0) return null

  if (metric === 'target') {
    const ranked = [...muscles].sort(
      (a, b) => b.sets / targetFor(b.group).min - a.sets / targetFor(a.group).min,
    )
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Weekly target progress</h3>
        <ul className="space-y-2.5">
          {ranked.map((m) => {
            const target = targetFor(m.group)
            const onTarget = m.sets >= target.min
            return (
              <li key={m.group}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="capitalize text-slate-300">{m.group}</span>
                  <span className="tabular-nums text-slate-400">
                    {m.sets} / {target.min}–{target.max} sets
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn('h-full rounded-full', onTarget ? 'bg-emerald-500' : 'bg-accent')}
                    style={{ width: `${Math.min(100, (m.sets / target.max) * 100)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Targets are the recommended weekly sets for each group. Bars turn green once a group is in
          range.
        </p>
      </section>
    )
  }

  const max = Math.max(...muscles.map((m) => m.sets), 1)
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Muscle group leaderboard</h3>
      <ul className="space-y-2.5">
        {muscles.map((m, i) => (
          <li key={m.group}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-slate-300">
                <span className="mr-1.5 text-slate-600 tabular-nums">{i + 1}</span>
                <span className="capitalize">{m.group}</span>
              </span>
              <span className="tabular-nums text-slate-400">
                {m.sets} {m.sets === 1 ? 'set' : 'sets'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, (m.sets / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
