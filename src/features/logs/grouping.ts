import type { EventLog } from '@/db/types'
import { startOfDay } from '@/lib/date'

export interface DayGroup {
  /** Local-midnight epoch ms; stable key for the day. */
  dayStart: number
  logs: EventLog[]
}

/**
 * Group logs into days for the journal, newest day first and newest entry
 * first within each day. Pure and side-effect free so it can be unit tested
 * and reused by the insights stage later.
 */
export function groupLogsByDay(logs: readonly EventLog[]): DayGroup[] {
  const byDay = new Map<number, EventLog[]>()

  for (const log of logs) {
    const key = startOfDay(log.occurredAt)
    const bucket = byDay.get(key)
    if (bucket) bucket.push(log)
    else byDay.set(key, [log])
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => b - a)
    .map(([dayStart, dayLogs]) => ({
      dayStart,
      logs: dayLogs.sort((a, b) => b.occurredAt - a.occurredAt),
    }))
}
