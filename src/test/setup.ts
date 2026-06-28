// Test bootstrap (runs once per test file).
//
// Vitest reuses worker processes across files, and fake-indexeddb/auto does not
// hand out a fresh backend on reuse — so a later file can inherit a prior
// file's open `ashout` connection, and their Dexie live-query events cross-talk
// (flaky live-query assertions). Forcing one pristine IDBFactory at file load
// gives every file a clean, private backend. Done once here (not per test) to
// avoid swapping the factory mid-render.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import Dexie from 'dexie'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { db } from '@/db/db'

const backend = new IDBFactory()
globalThis.indexedDB = backend
Dexie.dependencies.indexedDB = backend

// Live-query refetches are async; give findBy*/waitFor generous headroom.
configure({ asyncUtilTimeout: 5000 })

afterEach(async () => {
  cleanup()
  await db.logs.clear()
})
