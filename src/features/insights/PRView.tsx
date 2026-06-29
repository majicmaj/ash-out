import { lazy, Suspense, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { formatDayLabel, startOfDay } from '@/lib/date'
import { useWeightUnit } from '@/features/settings/weightUnit'
import { useDay } from './hooks'
import type { DayExercise } from './records'

// Body chart inlines four SVGs — load it only when this tab is opened.
const MuscleMap = lazy(() => import('./MuscleMap').then((m) => ({ default: m.MuscleMap })))

const DAY_MS = 86_400_000

/**
 * PRs tab: pick a day and compare that day's lifts to your all-time records.
 * The body map turns a muscle green when the day matched or beat its PR, and
 * the list shows each exercise's top set and estimated 1RM vs your best.
 */
export function PRView() {
  const [today] = useState(() => startOfDay(Date.now()))
  const [day, setDay] = useState(today)
  const data = useDay(day)
  const isToday = day >= today

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setDay(day - DAY_MS)}
          aria-label="Previous day"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <ChevronLeftIcon width={20} height={20} />
        </button>
        <span className="min-w-32 text-center text-sm font-medium text-slate-200">
          {formatDayLabel(day)}
        </span>
        <button
          type="button"
          onClick={() => setDay(Math.min(day + DAY_MS, today))}
          disabled={isToday}
          aria-label="Next day"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRightIcon width={20} height={20} />
        </button>
      </div>

      {!data ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
      ) : data.exercises.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-slate-400">
          No logged lifts on this day. Weighted exercises show up here so you can see how they stack
          up against your records.
        </p>
      ) : (
        <>
          <Suspense fallback={null}>
            <MuscleMap muscles={[]} window="day" metric="pr" musclePRs={data.musclePRs} />
          </Suspense>
          <ExerciseList exercises={data.exercises} />
        </>
      )}
    </div>
  )
}

const fmt = (n: number) => Number(n.toFixed(1)).toLocaleString()

function ExerciseList({ exercises }: { exercises: DayExercise[] }) {
  const unit = useWeightUnit()
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-300">This day vs your PR</h3>
      <ul className="space-y-2">
        {exercises.map((e) => (
          <li key={e.exercise} className="rounded-lg bg-slate-800/40 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate capitalize text-slate-200">{e.exercise}</span>
              {e.hitPR && (
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  ★ PR
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs tabular-nums text-slate-500">
              {e.reps > 0 ? `${fmt(e.weightKg)} ${unit} × ${e.reps}` : `${fmt(e.weightKg)} ${unit}`}
              {'  ·  '}
              1RM ~{fmt(e.est1RM)} {unit}
              {!e.hitPR && <span className="text-slate-600"> {' / '} best ~{fmt(e.prEst1RM)}</span>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        1RM is estimated from the day's best set (Epley: weight × (1 + reps ÷ 30)).
      </p>
    </section>
  )
}
