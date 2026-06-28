import { describe, it, expect } from 'vitest'
import { startOfDay, formatDayLabel, toDatetimeLocalValue, fromDatetimeLocalValue } from './date'

describe('startOfDay', () => {
  it('returns local midnight for a timestamp', () => {
    const noon = new Date(2026, 5, 28, 12, 30).getTime()
    const result = new Date(startOfDay(noon))
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getDate()).toBe(28)
  })

  it('is idempotent', () => {
    const ts = new Date(2026, 0, 1, 9).getTime()
    expect(startOfDay(startOfDay(ts))).toBe(startOfDay(ts))
  })
})

describe('formatDayLabel', () => {
  const now = new Date(2026, 5, 28, 10).getTime()

  it('labels today and yesterday', () => {
    expect(formatDayLabel(startOfDay(now), now)).toBe('Today')
    expect(formatDayLabel(startOfDay(now - 86_400_000), now)).toBe('Yesterday')
  })

  it('labels older days with a weekday and date', () => {
    const label = formatDayLabel(startOfDay(now - 5 * 86_400_000), now)
    expect(label).not.toBe('Today')
    expect(label).toMatch(/\w+,\s\w+\s\d+/)
  })
})

describe('datetime-local round trip', () => {
  it('survives a value -> input -> value round trip to the minute', () => {
    const ts = new Date(2026, 5, 28, 7, 45).getTime()
    const restored = fromDatetimeLocalValue(toDatetimeLocalValue(ts))
    expect(restored).toBe(ts)
  })
})
