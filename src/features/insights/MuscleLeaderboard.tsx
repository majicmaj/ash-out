import { cn } from '@/lib/cn'
import { OPTIMAL_WEEKLY_SETS, type MuscleStat } from './aggregate'
import type { TimeWindow } from './hooks'

/**
 * Ranks muscle groups by sets trained (the hypertrophy volume metric). For the
 * weekly view the bar scale is anchored to the recommended 10–20 sets target,
 * and groups that hit the lower bound are highlighted, so the chart reads as
 * progress toward a goal rather than just relative bars.
 */
export function MuscleLeaderboard({
  muscles,
  window,
}: {
  muscles: MuscleStat[]
  window: TimeWindow
}) {
  if (muscles.length === 0) return null

  const weekly = window === 'week'
  const max = Math.max(...muscles.map((m) => m.sets), weekly ? OPTIMAL_WEEKLY_SETS.max : 1)

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Muscle group leaderboard</h3>
      <ul className="space-y-2.5">
        {muscles.map((m, i) => {
          const onTarget = weekly && m.sets >= OPTIMAL_WEEKLY_SETS.min
          return (
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
                  className={cn('h-full rounded-full', onTarget ? 'bg-emerald-500' : 'bg-accent')}
                  style={{ width: `${Math.min(100, (m.sets / max) * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      {weekly && (
        <p className="mt-3 text-xs text-slate-500">
          Target ≈ {OPTIMAL_WEEKLY_SETS.min}–{OPTIMAL_WEEKLY_SETS.max} sets per group each week.
          Bars turn green at {OPTIMAL_WEEKLY_SETS.min}.
        </p>
      )}
    </section>
  )
}
