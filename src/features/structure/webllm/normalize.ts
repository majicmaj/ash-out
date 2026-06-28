import type {
  ExerciseSet,
  MealEvent,
  MuscleGroup,
  NoteEvent,
  StructuredEvent,
  WorkoutEvent,
} from '@/db/types'
import { estimateVolumeKg } from '../sets'
import { MUSCLE_GROUPS } from './schema'

/**
 * Turn a model's JSON reply into validated StructuredEvents. Even with
 * constrained decoding we never trust raw output: unknown fields are dropped,
 * types are coerced, and malformed events are discarded rather than stored.
 * Pure and fully unit-tested without needing the model.
 */
export function parseModelEvents(content: string): StructuredEvent[] {
  const data = safeParse(content)
  const events = (data as { events?: unknown } | null)?.events
  if (!Array.isArray(events)) return []
  return events.map(normalizeEvent).filter((e): e is StructuredEvent => e !== null)
}

function safeParse(content: string): unknown {
  // Tolerate models that wrap JSON in ```json fences or add stray prose.
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : content
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(body.slice(start, end + 1))
  } catch {
    return null
  }
}

function normalizeEvent(raw: unknown): StructuredEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  switch (r.kind) {
    case 'workout':
      return normalizeWorkout(r)
    case 'meal':
      return normalizeMeal(r)
    case 'note':
      return normalizeNote(r)
    default:
      return null
  }
}

function normalizeWorkout(r: Record<string, unknown>): WorkoutEvent | null {
  const exercise = str(r.exercise)
  if (!exercise) return null
  const event: WorkoutEvent = { kind: 'workout', exercise }

  const muscleGroups = muscles(r.muscleGroups)
  if (muscleGroups.length) event.muscleGroups = muscleGroups

  const sets = normalizeSets(r.sets)
  if (sets.length) {
    event.sets = sets
    const volume = num(r.estimatedVolumeKg) ?? estimateVolumeKg(sets)
    if (volume !== undefined) event.estimatedVolumeKg = Math.round(volume)
  }
  return event
}

function normalizeMeal(r: Record<string, unknown>): MealEvent | null {
  const description = str(r.description) ?? str(r.text)
  if (!description) return null
  const event: MealEvent = { kind: 'meal', description }
  assignNum(event, 'calories', r.calories)
  assignNum(event, 'proteinG', r.proteinG)
  assignNum(event, 'carbsG', r.carbsG)
  assignNum(event, 'fatG', r.fatG)
  return event
}

function normalizeNote(r: Record<string, unknown>): NoteEvent | null {
  const text = str(r.text) ?? str(r.description)
  return text ? { kind: 'note', text } : null
}

function normalizeSets(raw: unknown): ExerciseSet[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s) => {
      if (typeof s !== 'object' || s === null) return null
      const rec = s as Record<string, unknown>
      const set: ExerciseSet = {}
      assignNum(set, 'reps', rec.reps)
      assignNum(set, 'weightKg', rec.weightKg)
      assignNum(set, 'durationSec', rec.durationSec)
      assignNum(set, 'distanceM', rec.distanceM)
      return Object.keys(set).length ? set : null
    })
    .filter((s): s is ExerciseSet => s !== null)
}

// --- coercion helpers ---

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function muscles(v: unknown): MuscleGroup[] {
  if (!Array.isArray(v)) return []
  const valid = v.filter((g): g is MuscleGroup => MUSCLE_GROUPS.includes(g as MuscleGroup))
  return [...new Set(valid)]
}

function assignNum<T extends object>(target: T, key: keyof T, value: unknown): void {
  const n = num(value)
  if (n !== undefined) (target[key] as unknown as number) = n
}
