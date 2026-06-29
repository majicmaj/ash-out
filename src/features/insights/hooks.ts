import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { startOfDay } from '@/lib/date'
import { computeInsights, filterSince, type Insights } from './aggregate'
import {
  computeDayComparison,
  computeMusclePRs,
  computeRecords,
  type DayExercise,
  type ExerciseRecord,
  type MusclePR,
} from './records'
import type { MuscleGroup } from '@/db/types'

export type TimeWindow = 'day' | 'week' | 'month' | 'all'

export const WINDOW_LABELS: Record<TimeWindow, string> = {
  day: 'Today',
  week: '7 days',
  month: '30 days',
  all: 'All time',
}

const WINDOW_DAYS: Record<TimeWindow, number> = { day: 1, week: 7, month: 30, all: Infinity }

/** Start of the window (epoch ms): today from midnight, others rolling, all = 0. */
function windowStart(window: TimeWindow): number {
  if (window === 'day') return startOfDay(Date.now())
  const days = WINDOW_DAYS[window]
  return Number.isFinite(days) ? Date.now() - days * 86_400_000 : 0
}

/** Live insights for a time window. Recomputes whenever logs change. The
 *  window's span (in days) is attached so targets can scale to it — for "all
 *  time" it's the actual stretch from the first entry to now. */
export function useInsights(window: TimeWindow): Insights | undefined {
  return useLiveQuery(async () => {
    const logs = await db.logs.toArray()
    const scoped = filterSince(logs, windowStart(window))
    const insights = computeInsights(scoped)
    return { ...insights, windowDays: windowDaysFor(window, scoped) }
  }, [window])
}

/** Live per-exercise personal records; PRs in the window are flagged. */
export function useRecords(window: TimeWindow): ExerciseRecord[] | undefined {
  return useLiveQuery(async () => {
    const logs = await db.logs.toArray()
    return computeRecords(logs, windowStart(window))
  }, [window])
}

export interface DayPRs {
  exercises: DayExercise[]
  musclePRs: Map<MuscleGroup, MusclePR>
}

/** One day's lifts compared to all-time PRs: the exercise list + body-map status. */
export function useDay(dayStart: number): DayPRs | undefined {
  return useLiveQuery(async () => {
    const logs = await db.logs.toArray()
    const to = dayStart + 86_400_000
    return {
      exercises: computeDayComparison(logs, dayStart, to),
      musclePRs: computeMusclePRs(logs, dayStart, to),
    }
  }, [dayStart])
}

function windowDaysFor(window: TimeWindow, scoped: { occurredAt: number }[]): number {
  if (window !== 'all') return WINDOW_DAYS[window]
  const earliest = scoped.length ? Math.min(...scoped.map((l) => l.occurredAt)) : Date.now()
  return Math.max(1, Math.ceil((Date.now() - earliest) / 86_400_000))
}
