import { db } from '@/db/db'
import type { EventLog, StructuredEvent } from '@/db/types'
import { muscleGroupsFor } from '@/features/structure/muscleGroups'
import { estimateVolumeKg } from '@/features/structure/sets'
import { newId } from '@/lib/id'

/**
 * All writes to the log store flow through here. Keeping persistence out of the
 * components means the UI never touches Dexie directly and the rules
 * (timestamps, status, trimming) live in exactly one place.
 */

export interface CreateLogInput {
  rawText: string
  /** Defaults to now. Lets the user back-date an entry. */
  occurredAt?: number
}

/** Create a raw log. Returns the saved record, or null if the text is empty. */
export async function createLog(input: CreateLogInput): Promise<EventLog | null> {
  const rawText = input.rawText.trim()
  if (!rawText) return null

  const now = Date.now()
  const log: EventLog = {
    id: newId(),
    rawText,
    occurredAt: input.occurredAt ?? now,
    createdAt: now,
    updatedAt: now,
    status: 'raw',
  }
  await db.logs.add(log)
  return log
}

export type LogPatch = Partial<Pick<EventLog, 'rawText' | 'occurredAt'>>

/** Edit a log's text or time. Editing text resets it to 'raw' so step 2 can
 *  re-process it from a clean slate. */
export async function updateLog(id: string, patch: LogPatch): Promise<void> {
  const changes: Partial<EventLog> = { ...patch, updatedAt: Date.now() }
  if (patch.rawText !== undefined) {
    changes.rawText = patch.rawText.trim()
    changes.status = 'raw'
    changes.structured = undefined
    changes.modelId = undefined
  }
  await db.logs.update(id, changes)
}

/**
 * Persist hand-edited structured events (e.g. after adjusting individual sets).
 * Muscle groups and volume are re-derived so insights stay consistent, and the
 * status stays `structured` so the background parser leaves these edits alone —
 * unlike a raw-text edit, which resets to `raw` and re-parses from scratch.
 */
export async function updateLogStructured(
  id: string,
  structured: StructuredEvent[],
): Promise<void> {
  const cleaned = structured.map((event) => {
    if (event.kind !== 'workout') return event
    const muscleGroups = muscleGroupsFor(event.exercise)
    const volume = event.sets ? estimateVolumeKg(event.sets) : undefined
    return {
      ...event,
      muscleGroups: muscleGroups.length ? muscleGroups : undefined,
      estimatedVolumeKg: volume,
    }
  })
  await db.logs.update(id, { structured: cleaned, status: 'structured', updatedAt: Date.now() })
}

export async function deleteLog(id: string): Promise<void> {
  await db.logs.delete(id)
}

/** Remove every log. Used by the "clear data" control in settings. */
export async function clearAllLogs(): Promise<void> {
  await db.logs.clear()
}
