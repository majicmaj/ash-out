import type { MuscleGroup } from '@/db/types'

/** Allowed muscle-group values, shared by the schema and the normalizer. */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'core',
  'cardio',
  'other',
]

/**
 * JSON schema handed to WebLLM's grammar-constrained decoder so the model can
 * only emit output that already matches our data shape. Kept in step with the
 * StructuredEvent union in db/types.ts.
 */
export const EVENTS_SCHEMA = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['workout', 'meal', 'note'] },
          exercise: { type: 'string' },
          muscleGroups: { type: 'array', items: { type: 'string', enum: MUSCLE_GROUPS } },
          sets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                reps: { type: 'number' },
                weightKg: { type: 'number' },
                durationSec: { type: 'number' },
                distanceM: { type: 'number' },
              },
            },
          },
          description: { type: 'string' },
          calories: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
          text: { type: 'string' },
        },
        required: ['kind'],
      },
    },
  },
  required: ['events'],
} as const

export const EVENTS_SCHEMA_JSON = JSON.stringify(EVENTS_SCHEMA)
