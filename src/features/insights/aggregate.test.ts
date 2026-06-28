import { describe, it, expect } from 'vitest'
import type { EventLog, StructuredEvent } from '@/db/types'
import { computeInsights, filterSince } from './aggregate'

let counter = 0
function log(structured: StructuredEvent[], occurredAt = Date.now()): EventLog {
  const id = `log-${counter++}`
  return {
    id,
    rawText: 'x',
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    status: 'structured',
    structured,
  }
}

describe('computeInsights', () => {
  it('aggregates sets, volume, and ranks muscle groups', () => {
    const logs = [
      log([
        {
          kind: 'workout',
          exercise: 'bench press',
          muscleGroups: ['chest', 'triceps'],
          sets: [
            { reps: 8, weightKg: 60 },
            { reps: 8, weightKg: 60 },
            { reps: 8, weightKg: 60 },
          ],
          estimatedVolumeKg: 1440,
        },
      ]),
      log([
        {
          kind: 'workout',
          exercise: 'curl',
          muscleGroups: ['biceps'],
          sets: [{ reps: 10, weightKg: 20 }],
          estimatedVolumeKg: 200,
        },
      ]),
    ]
    const r = computeInsights(logs)
    expect(r.totalSets).toBe(4)
    expect(r.totalVolumeKg).toBe(1640)
    expect(r.muscles[0].group).toBe('chest') // 3 sets, top of leaderboard
    expect(r.muscles.find((m) => m.group === 'biceps')?.sets).toBe(1)
  })

  it('summarizes cardio separately, not as a muscle', () => {
    const r = computeInsights([
      log([
        {
          kind: 'workout',
          exercise: 'run',
          muscleGroups: ['cardio'],
          sets: [{ distanceM: 5000, durationSec: 1800 }],
        },
      ]),
    ])
    expect(r.totalDistanceM).toBe(5000)
    expect(r.totalDurationSec).toBe(1800)
    expect(r.totalSets).toBe(0)
    expect(r.muscles).toHaveLength(0)
  })

  it('counts distinct workout days and meals', () => {
    const day1 = new Date(2026, 5, 1, 9).getTime()
    const day1pm = new Date(2026, 5, 1, 18).getTime()
    const day2 = new Date(2026, 5, 2, 9).getTime()
    const r = computeInsights([
      log(
        [{ kind: 'workout', exercise: 'squat', muscleGroups: ['legs'], sets: [{ reps: 5 }] }],
        day1,
      ),
      log(
        [{ kind: 'workout', exercise: 'bench', muscleGroups: ['chest'], sets: [{ reps: 5 }] }],
        day1pm,
      ),
      log(
        [{ kind: 'workout', exercise: 'row', muscleGroups: ['back'], sets: [{ reps: 5 }] }],
        day2,
      ),
      log([{ kind: 'meal', description: 'eggs' }], day2),
    ])
    expect(r.workoutDays).toBe(2)
    expect(r.mealCount).toBe(1)
  })

  it('ignores unstructured logs', () => {
    const raw: EventLog = {
      id: 'r',
      rawText: 'x',
      occurredAt: 1,
      createdAt: 1,
      updatedAt: 1,
      status: 'raw',
    }
    expect(computeInsights([raw]).totalSets).toBe(0)
  })

  it('counts a sets-less strength entry as one set', () => {
    const r = computeInsights([
      log([{ kind: 'workout', exercise: 'pull ups', muscleGroups: ['back'] }]),
    ])
    expect(r.muscles[0]).toMatchObject({ group: 'back', sets: 1 })
  })
})

describe('filterSince', () => {
  it('keeps only logs at or after the cutoff', () => {
    const logs = [log([], 100), log([], 200), log([], 300)]
    expect(filterSince(logs, 200)).toHaveLength(2)
  })
})
