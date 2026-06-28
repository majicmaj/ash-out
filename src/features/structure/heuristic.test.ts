import { describe, it, expect } from 'vitest'
import type { MealEvent, NoteEvent, WorkoutEvent } from '@/db/types'
import { heuristicStructurer, splitClauses, structureClause } from './heuristic'
import { parseSets, estimateVolumeKg } from './sets'
import { muscleGroupsFor } from './muscleGroups'

describe('splitClauses', () => {
  it('splits on newlines, commas, and "then"', () => {
    expect(splitClauses('bench 3x8, 5k run\nthen squats')).toEqual([
      'bench 3x8',
      '5k run',
      'squats',
    ])
  })

  it('keeps meal phrases with + or "and" intact', () => {
    expect(splitClauses('grilled chicken salad + rice and beans')).toEqual([
      'grilled chicken salad + rice and beans',
    ])
  })

  it('drops empty fragments', () => {
    expect(splitClauses('  ,  \n , ')).toEqual([])
  })
})

describe('parseSets', () => {
  it('expands NxM into one set per working set', () => {
    expect(parseSets('bench 3x8')).toEqual([{ reps: 8 }, { reps: 8 }, { reps: 8 }])
  })

  it('applies a weight to every set', () => {
    expect(parseSets('bench 3x8 @ 60kg')).toEqual([
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
    ])
  })

  it('handles a bare rep count or weight', () => {
    expect(parseSets('8 reps')).toEqual([{ reps: 8 }])
    expect(parseSets('deadlift 100kg')).toEqual([{ weightKg: 100 }])
  })

  it('returns undefined with nothing strength-like', () => {
    expect(parseSets('felt great today')).toBeUndefined()
  })
})

describe('estimateVolumeKg', () => {
  it('sums reps × weight', () => {
    expect(estimateVolumeKg([{ reps: 8, weightKg: 60 }, { reps: 8, weightKg: 60 }])).toBe(960)
  })

  it('is undefined without loaded reps', () => {
    expect(estimateVolumeKg([{ reps: 8 }])).toBeUndefined()
  })
})

describe('muscleGroupsFor', () => {
  it('maps common lifts', () => {
    expect(muscleGroupsFor('bench press')).toContain('chest')
    expect(muscleGroupsFor('barbell row')).toContain('back')
    expect(muscleGroupsFor('back squat')).toContain('legs')
    expect(muscleGroupsFor('deadlift')).toEqual(expect.arrayContaining(['back', 'glutes', 'legs']))
  })

  it('tags cardio', () => {
    expect(muscleGroupsFor('5k run')).toEqual(['cardio'])
  })

  it('returns empty for unknown', () => {
    expect(muscleGroupsFor('meditation')).toEqual([])
  })
})

describe('structureClause', () => {
  it('structures a strength clause with sets, muscles, and volume', () => {
    const e = structureClause('bench press 3x8 @ 60kg') as WorkoutEvent
    expect(e.kind).toBe('workout')
    expect(e.exercise).toBe('bench press')
    expect(e.sets).toHaveLength(3)
    expect(e.muscleGroups).toContain('chest')
    expect(e.estimatedVolumeKg).toBe(1440)
  })

  it('structures a cardio clause with distance', () => {
    const e = structureClause('5k easy run') as WorkoutEvent
    expect(e.kind).toBe('workout')
    expect(e.muscleGroups).toEqual(['cardio'])
    expect(e.sets?.[0].distanceM).toBe(5000)
  })

  it('classifies a meal', () => {
    const e = structureClause('grilled chicken salad + rice') as MealEvent
    expect(e.kind).toBe('meal')
    expect(e.description).toBe('grilled chicken salad + rice')
  })

  it('falls back to a note', () => {
    const e = structureClause('felt strong and well rested') as NoteEvent
    expect(e.kind).toBe('note')
  })
})

describe('heuristicStructurer', () => {
  it('is always available', async () => {
    expect(await heuristicStructurer.isAvailable()).toBe(true)
  })

  it('structures a compound log into multiple events', async () => {
    const events = await heuristicStructurer.structure(
      'bench press 3x8 at 60kg, then 5k run\noatmeal with banana',
    )
    expect(events.map((e) => e.kind)).toEqual(['workout', 'workout', 'meal'])
  })

  it('returns nothing for empty input', async () => {
    expect(await heuristicStructurer.structure('   ')).toEqual([])
  })
})
