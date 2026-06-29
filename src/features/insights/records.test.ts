import { describe, expect, it } from 'vitest'
import type { EventLog, StructuredEvent } from '@/db/types'
import { computeMusclePRs, computeRecords } from './records'

let counter = 0
const log = (structured: StructuredEvent[], occurredAt: number): EventLog => ({
  id: `log-${counter++}`,
  rawText: 'x',
  occurredAt,
  createdAt: occurredAt,
  updatedAt: occurredAt,
  status: 'structured',
  structured,
})

const bench = (weightKg: number, reps: number, volume: number): StructuredEvent => ({
  kind: 'workout',
  exercise: 'Bench Press',
  muscleGroups: ['chest'],
  sets: [{ reps, weightKg }],
  estimatedVolumeKg: volume,
})

const DAY = 86_400_000
const tEarly = 2 * DAY
const tLate = 10 * DAY
const between = 5 * DAY

describe('computeRecords', () => {
  it('tracks the heaviest set, 1RM, and best session volume across history', () => {
    const r = computeRecords([log([bench(90, 5, 1350)], tEarly), log([bench(100, 5, 1500)], tLate)], 0)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ exercise: 'Bench Press', bestWeightKg: 100, bestReps: 5 })
    expect(r[0].bestVolumeKg).toBe(1500)
    expect(r[0].est1RM).toBe(Math.round(100 * (1 + 5 / 30))) // 117
  })

  it('flags a PR when the all-time best falls in the window', () => {
    // PR (100kg) is the recent session; window opens before it.
    const logs = [log([bench(90, 5, 1350)], tEarly), log([bench(100, 5, 1500)], tLate)]
    expect(computeRecords(logs, between).at(0)?.prInWindow).toBe(true)
  })

  it('does not flag a PR when the recent session was weaker than the all-time best', () => {
    // PR (100kg) is the old session; only a weaker 80kg falls in the window.
    const logs = [log([bench(100, 5, 1500)], tEarly), log([bench(80, 5, 1200)], tLate)]
    const r = computeRecords(logs, between)
    expect(r.at(0)?.bestWeightKg).toBe(100)
    expect(r.at(0)?.prInWindow).toBe(false)
  })

  it('marks a muscle group green when the window matches the all-time PR', () => {
    // 100kg PR set earlier and matched again inside the window.
    const logs = [log([bench(100, 5, 1500)], tEarly), log([bench(100, 5, 1500)], tLate)]
    const prs = computeMusclePRs(logs, between)
    expect(prs.get('chest')?.hitPR).toBe(true)
    expect(prs.get('triceps')).toBeUndefined() // bench here only tags chest
  })

  it('does not mark green when the window stayed below the PR', () => {
    const logs = [log([bench(100, 5, 1500)], tEarly), log([bench(80, 5, 1200)], tLate)]
    const prs = computeMusclePRs(logs, between)
    expect(prs.get('chest')?.hitPR).toBe(false)
    expect(prs.get('chest')?.ratio).toBeLessThan(1)
  })

  it('ignores bodyweight/cardio entries with no load', () => {
    const r = computeRecords(
      [log([{ kind: 'workout', exercise: 'pull ups', muscleGroups: ['back'], sets: [{ reps: 10 }] }], tEarly)],
      0,
    )
    expect(r).toHaveLength(0)
  })
})
