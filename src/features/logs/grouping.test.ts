import { describe, it, expect } from 'vitest'
import type { EventLog } from '@/db/types'
import { groupLogsByDay } from './grouping'

function log(partial: Partial<EventLog> & { id: string; occurredAt: number }): EventLog {
  return {
    rawText: 'x',
    createdAt: partial.occurredAt,
    updatedAt: partial.occurredAt,
    status: 'raw',
    ...partial,
  }
}

describe('groupLogsByDay', () => {
  const day1Morning = new Date(2026, 5, 27, 8).getTime()
  const day1Evening = new Date(2026, 5, 27, 20).getTime()
  const day2 = new Date(2026, 5, 28, 12).getTime()

  it('buckets entries from the same day together', () => {
    const groups = groupLogsByDay([
      log({ id: 'a', occurredAt: day1Morning }),
      log({ id: 'b', occurredAt: day1Evening }),
      log({ id: 'c', occurredAt: day2 }),
    ])
    expect(groups).toHaveLength(2)
    expect(groups[0].logs).toHaveLength(1)
    expect(groups[1].logs).toHaveLength(2)
  })

  it('orders days newest first', () => {
    const groups = groupLogsByDay([
      log({ id: 'old', occurredAt: day1Morning }),
      log({ id: 'new', occurredAt: day2 }),
    ])
    expect(groups[0].logs[0].id).toBe('new')
  })

  it('orders entries within a day newest first', () => {
    const groups = groupLogsByDay([
      log({ id: 'morning', occurredAt: day1Morning }),
      log({ id: 'evening', occurredAt: day1Evening }),
    ])
    expect(groups[0].logs.map((l) => l.id)).toEqual(['evening', 'morning'])
  })

  it('returns an empty array for no logs', () => {
    expect(groupLogsByDay([])).toEqual([])
  })
})
