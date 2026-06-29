import { cn } from '@/lib/cn'
import { scaleTarget, targetFor, type MuscleStat } from './aggregate'

export type MuscleMetric = 'count' | 'target'

/**
 * The per-muscle-group breakdown, in one of two views:
 *  - `count`: ranked by sets trained (raw training volume).
 *  - `target`: each group against its set target for the selected window
 *    (the weekly target scaled to the window — a daily share for "Today", a
 *    month's worth for "30 days"). Bars turn green once a group is in range.
 */
export function MuscleLeaderboard({
  muscles,
  metric,
  windowDays = 7,
}: {
  muscles: MuscleStat[]
  metric: MuscleMetric
  windowDays?: number
}) {
  if (muscles.length === 0) return null

  if (metric === 'target') {
    const targets = new Map(muscles.map((m) => [m.group, scaleTarget(targetFor(m.group), windowDays)]))
    const ranked = [...muscles].sort(
      (a, b) => b.sets / targets.get(b.group)!.min - a.sets / targets.get(a.group)!.min,
    )
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Target progress</h3>
        <ul className="space-y-2.5">
          {ranked.map((m) => {
            const target = targets.get(m.group)!
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
          Targets are the recommended sets per group, scaled to the selected time range. Bars turn
          green once a group is in range.
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
