import { useState } from 'react'
import { Segmented } from '@/components/Segmented'
import { useInsights, WINDOW_LABELS, type TimeWindow } from './hooks'
import { StatCards } from './StatCards'
import { MuscleLeaderboard } from './MuscleLeaderboard'

const WINDOW_OPTIONS = (Object.keys(WINDOW_LABELS) as TimeWindow[]).map((value) => ({
  value,
  label: WINDOW_LABELS[value],
}))

/** Step 3 + 4: aggregated insights and the muscle-group leaderboard, derived
 *  entirely from on-device structured data. */
export function InsightsView() {
  const [window, setWindow] = useState<TimeWindow>('week')
  const insights = useInsights(window)

  const hasData =
    insights &&
    (insights.totalSets > 0 ||
      insights.totalDistanceM > 0 ||
      insights.totalDurationSec > 0 ||
      insights.mealCount > 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Segmented
          ariaLabel="Time window"
          options={WINDOW_OPTIONS}
          value={window}
          onChange={setWindow}
          size="sm"
        />
      </div>

      {!insights ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
      ) : !hasData ? (
        <p className="px-6 py-12 text-center text-sm text-slate-400">
          No structured activity in this window yet. Log a workout or meal and your insights will
          appear here.
        </p>
      ) : (
        <>
          <StatCards insights={insights} />
          <MuscleLeaderboard muscles={insights.muscles} window={window} />
        </>
      )}
    </div>
  )
}
