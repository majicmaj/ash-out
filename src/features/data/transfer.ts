import { db } from '@/db/db'
import type { EventLog } from '@/db/types'

/**
 * Local-first data ownership. Because everything lives on one device, users
 * need a way to back up and move their journal. Export/import round-trips the
 * full log store as plain JSON.
 */

const EXPORT_VERSION = 1

export interface ExportFile {
  app: 'ashout'
  version: number
  exportedAt: string
  logs: EventLog[]
}

/** Serialize the whole journal to a pretty-printed JSON string. */
export async function exportLogs(): Promise<string> {
  const logs = await db.logs.orderBy('occurredAt').toArray()
  const payload: ExportFile = {
    app: 'ashout',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    logs,
  }
  return JSON.stringify(payload, null, 2)
}

export interface ImportResult {
  imported: number
}

/**
 * Merge an exported file back in. Records are upserted by id, so re-importing a
 * backup is idempotent and importing from another device merges cleanly.
 * Throws on a malformed or foreign file rather than corrupting the store.
 */
export async function importLogs(json: string): Promise<ImportResult> {
  const data = parseExportFile(json)
  const valid = data.logs.filter(isValidLog)
  await db.logs.bulkPut(valid)
  return { imported: valid.length }
}

function parseExportFile(json: string): ExportFile {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    (data as ExportFile).app !== 'ashout' ||
    !Array.isArray((data as ExportFile).logs)
  ) {
    throw new Error('This does not look like an Ashout export.')
  }
  return data as ExportFile
}

/** Guard against partially-formed records before they reach the store. */
function isValidLog(value: unknown): value is EventLog {
  const log = value as EventLog
  return (
    typeof log === 'object' &&
    log !== null &&
    typeof log.id === 'string' &&
    typeof log.rawText === 'string' &&
    typeof log.occurredAt === 'number' &&
    typeof log.createdAt === 'number'
  )
}
