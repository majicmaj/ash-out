import { describe, it, expect } from 'vitest'
import { db } from '@/db/db'
import { createLog, updateLog, deleteLog, clearAllLogs } from './api'

describe('createLog', () => {
  it('persists a trimmed raw log with sensible defaults', async () => {
    const created = await createLog({ rawText: '  squats 5x5  ' })
    expect(created).not.toBeNull()
    expect(created!.rawText).toBe('squats 5x5')
    expect(created!.status).toBe('raw')
    expect(created!.occurredAt).toBe(created!.createdAt)

    const stored = await db.logs.get(created!.id)
    expect(stored?.rawText).toBe('squats 5x5')
  })

  it('ignores empty or whitespace-only input', async () => {
    expect(await createLog({ rawText: '   ' })).toBeNull()
    expect(await db.logs.count()).toBe(0)
  })

  it('honours an explicit occurredAt for back-dating', async () => {
    const when = new Date(2026, 0, 1, 9).getTime()
    const created = await createLog({ rawText: 'run', occurredAt: when })
    expect(created!.occurredAt).toBe(when)
  })
})

describe('updateLog', () => {
  it('edits text and resets structuring state', async () => {
    const created = await createLog({ rawText: 'bench' })
    // Simulate a record that step 2 had already processed.
    await db.logs.update(created!.id, { status: 'structured', structured: [] })

    await updateLog(created!.id, { rawText: 'bench press 3x8' })

    const stored = await db.logs.get(created!.id)
    expect(stored?.rawText).toBe('bench press 3x8')
    expect(stored?.status).toBe('raw')
    expect(stored?.structured).toBeUndefined()
  })

  it('bumps updatedAt without touching createdAt', async () => {
    const created = await createLog({ rawText: 'a' })
    await updateLog(created!.id, { rawText: 'b' })
    const stored = await db.logs.get(created!.id)
    expect(stored!.updatedAt).toBeGreaterThanOrEqual(stored!.createdAt)
  })
})

describe('deleteLog / clearAllLogs', () => {
  it('removes a single log', async () => {
    const created = await createLog({ rawText: 'a' })
    await deleteLog(created!.id)
    expect(await db.logs.get(created!.id)).toBeUndefined()
  })

  it('clears everything', async () => {
    await createLog({ rawText: 'a' })
    await createLog({ rawText: 'b' })
    await clearAllLogs()
    expect(await db.logs.count()).toBe(0)
  })
})
