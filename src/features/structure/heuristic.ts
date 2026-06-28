import type { ExerciseSet, MealEvent, NoteEvent, StructuredEvent, WorkoutEvent } from '@/db/types'
import type { Structurer } from './types'
import { parseDistanceM, parseDurationSec } from './measures'
import { muscleGroupsFor } from './muscleGroups'
import { estimateVolumeKg, parseSets } from './sets'

/**
 * A free, instant, offline parser. It splits a log into clauses and classifies
 * each as a workout (strength or cardio), a meal, or a note, extracting whatever
 * structure it can with rules — no model, no download, no GPU. This is the
 * default engine and the baseline the optional LLM upgrades on.
 */

const MEAL_HINTS = [
  'ate', 'eat', 'eaten', 'breakfast', 'lunch', 'dinner', 'snack', 'snacked', 'meal',
  'drank', 'shake', 'smoothie', 'coffee', 'tea', 'oatmeal', 'egg', 'chicken', 'beef',
  'steak', 'rice', 'salad', 'banana', 'apple', 'yogurt', 'toast', 'bread', 'pasta',
  'fish', 'salmon', 'tuna', 'sandwich', 'burger', 'pizza', 'soup', 'beans', 'nuts',
  'fruit', 'milk', 'cheese', 'protein', 'calories', 'kcal',
]

/** Split into the smallest meaningful units: lines, then clauses. */
export function splitClauses(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .flatMap((line) => line.split(/\s*(?:,|;|\bthen\b|\bafter that\b)\s*/i))
    .map((s) => s.trim())
    .filter(Boolean)
}

function hasMealHint(lower: string): boolean {
  return MEAL_HINTS.some((h) => new RegExp(`\\b${h}`, 'i').test(lower))
}

/** Remove measurement tokens and filler so the exercise name reads cleanly. */
function exerciseName(clause: string): string {
  const name = clause
    .replace(/\d+\s*[xX×]\s*\d+/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*(kgs?|kilos?|lbs?|pounds?|kms?|kilomet(?:er|re)s?|k|mi|miles?|m|met(?:er|re)s?|h|hrs?|hours?|mins?|minutes?|s|secs?|seconds?|reps?|sets?)\b/gi, ' ')
    .replace(/\b(at|for|of|x|sets? of)\b/gi, ' ')
    .replace(/[@#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return name || clause.trim()
}

function toWorkout(clause: string): WorkoutEvent {
  const muscleGroups = muscleGroupsFor(clause)
  const cardio = muscleGroups.length === 1 && muscleGroups[0] === 'cardio'
  const name = exerciseName(clause)

  if (cardio) {
    const distanceM = parseDistanceM(clause)
    const durationSec = parseDurationSec(clause)
    const set: ExerciseSet = {}
    if (distanceM !== undefined) set.distanceM = distanceM
    if (durationSec !== undefined) set.durationSec = durationSec
    const event: WorkoutEvent = { kind: 'workout', exercise: name, muscleGroups }
    if (Object.keys(set).length) event.sets = [set]
    return event
  }

  const sets = parseSets(clause)
  const event: WorkoutEvent = { kind: 'workout', exercise: name }
  if (muscleGroups.length) event.muscleGroups = muscleGroups
  if (sets) {
    event.sets = sets
    const volume = estimateVolumeKg(sets)
    if (volume !== undefined) event.estimatedVolumeKg = volume
  }
  return event
}

/** Classify and structure a single clause. */
export function structureClause(clause: string): StructuredEvent {
  const lower = clause.toLowerCase()
  const muscleGroups = muscleGroupsFor(clause)
  const looksWorkout =
    muscleGroups.length > 0 || parseSets(clause) !== undefined || parseDistanceM(clause) !== undefined

  if (looksWorkout) return toWorkout(clause)
  if (hasMealHint(lower)) return { kind: 'meal', description: clause } satisfies MealEvent
  return { kind: 'note', text: clause } satisfies NoteEvent
}

export const heuristicStructurer: Structurer = {
  id: 'heuristic',
  label: 'Built-in parser',
  isAvailable: () => Promise.resolve(true),
  structure: (rawText: string) =>
    Promise.resolve(splitClauses(rawText).map(structureClause)),
}
