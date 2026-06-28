import type { Insights } from './aggregate'
import { formatDistance, formatDuration } from '@/features/structure/summary'

/** Headline numbers for the selected window. Cards that would read zero (e.g.
 *  no cardio) are simply omitted to keep the grid meaningful. */
export function StatCards({ insights }: { insights: Insights }) {
  const cards: { label: string; value: string }[] = [
    { label: 'Workout days', value: String(insights.workoutDays) },
    { label: 'Total sets', value: String(insights.totalSets) },
  ]
  if (insights.totalVolumeKg > 0)
    cards.push({ label: 'Volume', value: `${insights.totalVolumeKg.toLocaleString()} kg` })
  if (insights.totalDistanceM > 0)
    cards.push({ label: 'Distance', value: formatDistance(insights.totalDistanceM) })
  if (insights.totalDurationSec > 0)
    cards.push({ label: 'Active time', value: formatDuration(insights.totalDurationSec) })
  if (insights.mealCount > 0) cards.push({ label: 'Meals', value: String(insights.mealCount) })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-2xl font-semibold tabular-nums text-slate-100">{c.value}</div>
          <div className="mt-0.5 text-xs text-slate-500">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
