import { describe, it, expect } from 'vitest'
import type { StructuredEvent } from '@/db/types'
import { summarizeLog, formatDistance, formatDuration } from './summary'

describe('summarizeLog', () => {
  it('aggregates muscles, volume, distance, and meals across events', () => {
    const events: StructuredEvent[] = [
      {
        kind: 'workout',
        exercise: 'bench press',
        muscleGroups: ['chest', 'triceps'],
        sets: [{ reps: 8, weightKg: 60 }],
        estimatedVolumeKg: 480,
      },
      { kind: 'workout', exercise: 'run', muscleGroups: ['cardio'], sets: [{ distanceM: 5000 }] },
      { kind: 'meal', description: 'oatmeal' },
    ]
    const s = summarizeLog(events)
    expect(s.muscles).toEqual(expect.arrayContaining(['chest', 'triceps', 'cardio']))
    expect(s.hasMeal).toBe(true)
    expect(s.metrics).toContain('480 kg volume')
    expect(s.metrics).toContain('5.0 km')
  })

  it('handles undefined / empty input', () => {
    expect(summarizeLog(undefined)).toEqual({ muscles: [], metrics: [], hasMeal: false })
  })
})

describe('formatDistance', () => {
  it('uses km past 1000 m', () => {
    expect(formatDistance(5000)).toBe('5.0 km')
    expect(formatDistance(800)).toBe('800 m')
  })
})

describe('formatDuration', () => {
  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(1800)).toBe('30 min')
    expect(formatDuration(3900)).toBe('1h 5m')
    expect(formatDuration(45)).toBe('45s')
  })
})
