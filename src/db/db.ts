import Dexie, { type EntityTable } from 'dexie'
import type { EventLog } from './types'

/**
 * The single on-device database. Everything lives in the browser's IndexedDB;
 * there is no server. Dexie gives us typed tables, indexed queries, live
 * React subscriptions, and versioned migrations.
 */
class AshoutDB extends Dexie {
  // `!` — Dexie assigns these in the constructor via `version().stores()`.
  logs!: EntityTable<EventLog, 'id'>

  constructor() {
    super('ashout')
    // Indexes: id (primary), and the timestamps + status we sort/filter on.
    // Add new indexed fields in a new `.version(2)` block — never edit this one.
    this.version(1).stores({
      logs: 'id, occurredAt, createdAt, status',
    })
  }
}

export const db = new AshoutDB()
export type { EventLog }
