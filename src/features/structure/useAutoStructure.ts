import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { structureLog } from './runStructuring'
import type { Structurer } from './types'

/**
 * Background structuring. Watches for logs still in the `raw` state and runs the
 * active engine over them one at a time. Because it's driven by a live query, it
 * naturally covers new entries, edits (which reset to `raw`), and imports — no
 * explicit triggering from the UI. A ref guard prevents overlapping passes.
 */
export function useAutoStructure(structurer: Structurer): void {
  const rawLogs = useLiveQuery(() => db.logs.where('status').equals('raw').toArray())
  const running = useRef(false)

  useEffect(() => {
    if (running.current || !rawLogs || rawLogs.length === 0) return
    if (!('structure' in structurer)) return

    running.current = true
    void (async () => {
      try {
        if (!(await structurer.isAvailable())) return
        for (const log of rawLogs) {
          await structureLog(log, structurer)
        }
      } finally {
        running.current = false
      }
    })()
  }, [rawLogs, structurer])
}
