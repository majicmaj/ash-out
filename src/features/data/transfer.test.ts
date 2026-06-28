import { describe, it, expect } from 'vitest'
import { db } from '@/db/db'
import { createLog } from '@/features/logs/api'
import { exportLogs, importLogs } from './transfer'

describe('export / import', () => {
  it('round-trips the journal', async () => {
    await createLog({ rawText: 'squats 5x5' })
    await createLog({ rawText: 'oatmeal' })

    const json = await exportLogs()
    await db.logs.clear()
    const result = await importLogs(json)

    expect(result.imported).toBe(2)
    expect(await db.logs.count()).toBe(2)
  })

  it('is idempotent — re-importing does not duplicate', async () => {
    await createLog({ rawText: 'run' })
    const json = await exportLogs()
    await importLogs(json)
    await importLogs(json)
    expect(await db.logs.count()).toBe(1)
  })

  it('produces a recognizable export envelope', async () => {
    await createLog({ rawText: 'x' })
    const parsed = JSON.parse(await exportLogs())
    expect(parsed.app).toBe('ashout')
    expect(parsed.version).toBe(1)
    expect(Array.isArray(parsed.logs)).toBe(true)
  })

  it('rejects non-JSON input', async () => {
    await expect(importLogs('not json')).rejects.toThrow(/valid JSON/)
  })

  it('rejects a foreign file shape', async () => {
    await expect(importLogs(JSON.stringify({ app: 'other', logs: [] }))).rejects.toThrow(/Ashout/)
  })

  it('skips malformed records but imports valid ones', async () => {
    const file = {
      app: 'ashout',
      version: 1,
      exportedAt: new Date().toISOString(),
      logs: [
        { id: 'ok', rawText: 'good', occurredAt: 1, createdAt: 1, updatedAt: 1, status: 'raw' },
        { id: 'bad' }, // missing required fields
      ],
    }
    const result = await importLogs(JSON.stringify(file))
    expect(result.imported).toBe(1)
  })
})
