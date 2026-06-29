import { describe, expect, it } from 'vitest'
import type { WorkoutEvent } from '@/db/types'
import { heuristicStructurer, isSetLine, parseLog } from './heuristic'
import { detectNotation, parseSetLine } from './sets'

const pair = (a: number, b: number, unit?: string) => ({ a, b, unit })

describe('detectNotation', () => {
  it('reads a descending unitless series as reps × weight (drop set)', () => {
    expect(detectNotation([pair(3, 100), pair(3, 85), pair(3, 70)], '3x100, 3x85, 3x70')).toBe(
      'reps_weight',
    )
  })

  it('reads small same-size values as sets × reps', () => {
    expect(detectNotation([pair(3, 8)], '3x8')).toBe('sets_reps')
    expect(detectNotation([pair(5, 5)], '5x5')).toBe('sets_reps')
  })

  it('treats an explicit line weight as sets × reps', () => {
    expect(detectNotation([pair(3, 8)], '3x8 @ 60kg')).toBe('sets_reps')
  })

  it('treats a unit on the second number as reps × weight', () => {
    expect(detectNotation([pair(3, 8, 'lbs')], '3x8lbs')).toBe('reps_weight')
  })

  it('treats an implausible rep count as a weight', () => {
    expect(detectNotation([pair(8, 40)], '8x40')).toBe('reps_weight')
  })
})

describe('parseSetLine', () => {
  it('parses a drop set with annotations into one set per item', () => {
    expect(parseSetLine('3x100, 3x85, (break) 7x55, 8x40')).toEqual([
      { reps: 3, weightKg: 100 },
      { reps: 3, weightKg: 85 },
      { reps: 7, weightKg: 55 },
      { reps: 8, weightKg: 40 },
    ])
  })

  it('keeps classic sets × reps @ weight', () => {
    expect(parseSetLine('3x8 @ 60kg')).toEqual([
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
    ])
  })

  it('expands bare sets × reps with no weight', () => {
    expect(parseSetLine('5x5')).toEqual([{ reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }])
  })

  it('keeps the weight number when a unit is attached to it', () => {
    expect(parseSetLine('3x8lbs')).toEqual([{ reps: 3, weightKg: 8 }])
  })
})

describe('isSetLine', () => {
  it('recognises pure set lines', () => {
    expect(isSetLine('8x55, 6x40, 5x25')).toBe(true)
    expect(isSetLine('3x8lbs each')).toBe(true)
    expect(isSetLine('100kg')).toBe(true)
  })

  it('rejects exercise names and prose', () => {
    expect(isSetLine('Machine Lateral raise')).toBe(false)
    expect(isSetLine('Weaker due to previous shoulder press.')).toBe(false)
  })
})

describe('parseLog — multi-line drop-set logbook', () => {
  const log = `Machine seated bicep curl
3x100, 3x85, 3x70, 3x55, (break) 7x55, 8x40

Machine shoulder press
5x78, 5x58, 6x38, 8x23, 5x8
Weaker due to previous shoulder press.

Lateral raise, front delt raise, rear delt
3x8lbs each`

  const events = parseLog(log)
  const workouts = events.filter((e): e is WorkoutEvent => e.kind === 'workout')

  it('attaches a drop set to the exercise named on the line above', () => {
    const curl = workouts.find((w) => w.exercise.includes('bicep curl'))!
    expect(curl.muscleGroups).toContain('biceps')
    expect(curl.sets).toHaveLength(6)
    expect(curl.sets?.[0]).toEqual({ reps: 3, weightKg: 100 })
    expect(curl.estimatedVolumeKg).toBeGreaterThan(0)
  })

  it('keeps subjective commentary as a note, not a workout', () => {
    expect(events.some((e) => e.kind === 'note')).toBe(true)
    expect(workouts.some((w) => /weaker/i.test(w.exercise))).toBe(false)
  })

  it('shares one set spec across a comma-listed superset', () => {
    const named = workouts.filter((w) =>
      ['lateral raise', 'front delt raise', 'rear delt'].includes(w.exercise.toLowerCase()),
    )
    expect(named).toHaveLength(3)
    for (const w of named) expect(w.sets).toHaveLength(1)
  })

  it('still handles single-line entries and meals', async () => {
    const out = await heuristicStructurer.structure('bench press 3x8 at 60kg, then 5k run\noatmeal with banana')
    expect(out.map((e) => e.kind)).toEqual(['workout', 'workout', 'meal'])
  })
})
