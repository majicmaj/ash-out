import { lazy, Suspense, useState } from 'react'
import { Segmented } from '@/components/Segmented'
import { useInsights, WINDOW_LABELS, type TimeWindow } from './hooks'
import { StatCards } from './StatCards'
import { MuscleLeaderboard, type MuscleMetric } from './MuscleLeaderboard'

// The anatomical chart inlines four full-body SVGs; load it only when the
// Insights tab is opened so the Journal's initial bundle stays small.
const MuscleMap = lazy(() =>
  import('./MuscleMap').then((m) => ({ default: m.MuscleMap })),
)

const WINDOW_OPTIONS = (Object.keys(WINDOW_LABELS) as TimeWindow[]).map((value) => ({
  value,
  label: WINDOW_LABELS[value],
}))

const METRIC_OPTIONS: { value: MuscleMetric; label: string }[] = [
  { value: 'count', label: 'Set count' },
  { value: 'target', label: 'vs Target' },
]

/** Step 3 + 4: aggregated insights and the muscle-group leaderboard, derived
 *  entirely from on-device structured data. */
export function InsightsView() {
  const [window, setWindow] = useState<TimeWindow>('week')
  const [metric, setMetric] = useState<MuscleMetric>('count')
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
          <Suspense fallback={null}>
            <MuscleMap muscles={insights.muscles} window={window} />
          </Suspense>
          {insights.muscles.length > 0 && (
            <div className="flex justify-center">
              <Segmented
                ariaLabel="Muscle metric"
                options={METRIC_OPTIONS}
                value={metric}
                onChange={setMetric}
                size="sm"
              />
            </div>
          )}
          <MuscleLeaderboard
            muscles={insights.muscles}
            metric={metric}
            windowDays={insights.windowDays}
          />
        </>
      )}
    </div>
  )
}
