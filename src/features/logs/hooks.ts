import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { EventLog } from '@/db/types'
import { groupLogsByDay, type DayGroup } from './grouping'

/**
 * Live view of all logs, ordered and grouped by day. `useLiveQuery` re-renders
 * automatically whenever the underlying IndexedDB data changes — no manual
 * cache invalidation, no global store.
 *
 * Returns `undefined` while the first query is in flight so callers can tell
 * "still loading" apart from "loaded, empty".
 *
 * Reads the whole table and sorts in `groupLogsByDay` rather than via an index.
 * A full-table read makes the live query observe every record, so edits to any
 * field — including non-indexed text — always refresh the journal. At personal
 * journal scale this is effectively free.
 */
export function useLogGroups(): DayGroup[] | undefined {
  const logs = useLiveQuery(() => db.logs.toArray())
  return logs && groupLogsByDay(logs)
}

/** Live total count of logs. */
export function useLogCount(): number | undefined {
  return useLiveQuery(() => db.logs.count())
}

/** Live single log by id, for editing views. */
export function useLog(id: string | undefined): EventLog | undefined {
  return useLiveQuery(() => (id ? db.logs.get(id) : undefined), [id])
}
