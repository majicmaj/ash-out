import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { startOfDay } from '@/lib/date'
import { computeInsights, filterSince, type Insights } from './aggregate'

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

/** Live insights for a time window. Recomputes whenever logs change. */
export function useInsights(window: TimeWindow): Insights | undefined {
  return useLiveQuery(async () => {
    const logs = await db.logs.toArray()
    return computeInsights(filterSince(logs, windowStart(window)))
  }, [window])
}
