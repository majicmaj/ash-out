import { describe, it, expect } from 'vitest'
import type { MealEvent, WorkoutEvent } from '@/db/types'
import { parseModelEvents } from './normalize'

describe('parseModelEvents', () => {
  it('parses a clean events array', () => {
    const json = JSON.stringify({
      events: [
        {
          kind: 'workout',
          exercise: 'bench press',
          muscleGroups: ['chest', 'triceps'],
          sets: [{ reps: 8, weightKg: 60 }],
        },
        { kind: 'meal', description: 'oatmeal', proteinG: 12 },
      ],
    })
    const events = parseModelEvents(json)
    expect(events).toHaveLength(2)
    const workout = events[0] as WorkoutEvent
    expect(workout.exercise).toBe('bench press')
    expect(workout.estimatedVolumeKg).toBe(480)
    expect((events[1] as MealEvent).proteinG).toBe(12)
  })

  it('strips ```json code fences and surrounding prose', () => {
    const content = 'Sure!\n```json\n{"events":[{"kind":"note","text":"rest day"}]}\n```'
    expect(parseModelEvents(content)).toEqual([{ kind: 'note', text: 'rest day' }])
  })

  it('drops invalid muscle groups and unknown fields', () => {
    const json = JSON.stringify({
      events: [{ kind: 'workout', exercise: 'curl', muscleGroups: ['biceps', 'wings'], bogus: 1 }],
    })
    const [e] = parseModelEvents(json) as WorkoutEvent[]
    expect(e.muscleGroups).toEqual(['biceps'])
    expect(e).not.toHaveProperty('bogus')
  })

  it('discards events missing required fields', () => {
    const json = JSON.stringify({
      events: [
        { kind: 'workout' }, // no exercise
        { kind: 'meal' }, // no description
        { kind: 'mystery' }, // unknown kind
        { kind: 'note', text: 'kept' },
      ],
    })
    expect(parseModelEvents(json)).toEqual([{ kind: 'note', text: 'kept' }])
  })

  it('coerces non-finite and wrong-typed numbers away', () => {
    const json = JSON.stringify({
      events: [{ kind: 'workout', exercise: 'squat', sets: [{ reps: '5', weightKg: 100 }] }],
    })
    const [e] = parseModelEvents(json) as WorkoutEvent[]
    expect(e.sets).toEqual([{ weightKg: 100 }])
  })

  it('returns [] for non-JSON or wrong shape', () => {
    expect(parseModelEvents('totally not json')).toEqual([])
    expect(parseModelEvents('{"nope":true}')).toEqual([])
  })
})
