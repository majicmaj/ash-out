import { db } from '@/db/db'
import type { EventLog } from '@/db/types'
import type { Structurer } from './types'

/**
 * Run one log through a structurer and persist the result, moving it through the
 * status lifecycle: raw → processing → structured (or failed). The raw text is
 * never modified — structuring only annotates.
 */
export async function structureLog(log: EventLog, structurer: Structurer): Promise<void> {
  await db.logs.update(log.id, { status: 'processing' })
  try {
    const structured = await structurer.structure(log.rawText)
    await db.logs.update(log.id, { status: 'structured', structured, modelId: structurer.id })
  } catch (error) {
    await db.logs.update(log.id, { status: 'failed' })
    throw error
  }
}
