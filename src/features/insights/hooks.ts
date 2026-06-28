import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { computeInsights, filterSince, type Insights } from './aggregate'

export type TimeWindow = 'week' | 'month' | 'all'

export const WINDOW_LABELS: Record<TimeWindow, string> = {
  week: '7 days',
  month: '30 days',
  all: 'All time',
}

const WINDOW_DAYS: Record<TimeWindow, number> = { week: 7, month: 30, all: Infinity }

/** Live insights for a rolling time window. Recomputes whenever logs change. */
export function useInsights(window: TimeWindow): Insights | undefined {
  return useLiveQuery(async () => {
    const logs = await db.logs.toArray()
    const days = WINDOW_DAYS[window]
    const since = Number.isFinite(days) ? Date.now() - days * 86_400_000 : 0
    return computeInsights(filterSince(logs, since))
  }, [window])
}
