import type { ExerciseSet, MealEvent, NoteEvent, StructuredEvent, WorkoutEvent } from '@/db/types'
import type { Structurer } from './types'
import { parseDistanceM, parseDurationSec } from './measures'
import { muscleGroupsFor } from './muscleGroups'
import { estimateVolumeKg, parseSetLine, parseSets } from './sets'

/**
 * A free, instant, offline parser. It splits a log into clauses and classifies
 * each as a workout (strength or cardio), a meal, or a note, extracting whatever
 * structure it can with rules — no model, no download, no GPU. This is the
 * default engine and the baseline the optional LLM upgrades on.
 */

const MEAL_HINTS = [
  'ate',
  'eat',
  'eaten',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'snacked',
  'meal',
  'drank',
  'shake',
  'smoothie',
  'coffee',
  'tea',
  'oatmeal',
  'egg',
  'chicken',
  'beef',
  'steak',
  'rice',
  'salad',
  'banana',
  'apple',
  'yogurt',
  'toast',
  'bread',
  'pasta',
  'fish',
  'salmon',
  'tuna',
  'sandwich',
  'burger',
  'pizza',
  'soup',
  'beans',
  'nuts',
  'fruit',
  'milk',
  'cheese',
  'protein',
  'calories',
  'kcal',
]

/**
 * Words that mark a line as a subjective note even when it mentions an exercise
 * ("weaker due to the previous shoulder press"). Checked before workout
 * classification so commentary isn't logged as training.
 */
const NOTE_HINTS = [
  'felt',
  'feeling',
  'weaker',
  'stronger',
  'due to',
  'because',
  'tired',
  'sore',
  'exhausted',
  'energy',
  'next time',
  'pump',
  'rest day',
  'easy day',
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

function hasNoteHint(lower: string): boolean {
  return NOTE_HINTS.some((h) => lower.includes(h))
}

/** Remove measurement tokens and filler so the exercise name reads cleanly. */
function exerciseName(clause: string): string {
  const name = clause
    .replace(/\d+\s*[xX×]\s*\d+/g, ' ')
    .replace(
      /\d+(?:\.\d+)?\s*(kgs?|kilos?|lbs?|pounds?|kms?|kilomet(?:er|re)s?|k|mi|miles?|m|met(?:er|re)s?|h|hrs?|hours?|mins?|minutes?|s|secs?|seconds?|reps?|sets?)\b/gi,
      ' ',
    )
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
  const hasNumbers = parseSets(clause) !== undefined || parseDistanceM(clause) !== undefined
  const looksWorkout = muscleGroups.length > 0 || hasNumbers

  // Subjective commentary ("weaker due to the shoulder press") can mention a
  // lift without being a logged set — only treat it as a workout if it carries
  // real numbers.
  if (looksWorkout && !(hasNoteHint(lower) && !hasNumbers)) return toWorkout(clause)
  if (hasMealHint(lower)) return { kind: 'meal', description: clause } satisfies MealEvent
  return { kind: 'note', text: clause } satisfies NoteEvent
}

/**
 * A line that is only set notation — "3x100, 3x85, (break) 7x55" or "8 reps @
 * 60kg" — with no exercise words of its own. These attach to the exercise named
 * on the line above, which is how people write a logbook.
 */
export function isSetLine(line: string): boolean {
  if (!/\d/.test(line)) return false
  const hadSetToken =
    /\d+\s*[xX×]\s*\d/.test(line) ||
    /\d+(?:\.\d+)?\s*(kgs?|kilos?|lbs?|pounds?|reps?|sets?)\b/i.test(line)
  if (!hadSetToken) return false
  const residual = line
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*(kgs?|kilos?|lbs?|pounds?|reps?|sets?|secs?|s)\b/gi, ' ')
    .replace(
      /\b(kgs?|kilos?|lbs?|pounds?|reps?|sets?|break|rest|drop\s*set|drop|superset|each|and|at|to|x|amrap|failure)\b/gi,
      ' ',
    )
    .replace(/[^a-z]/gi, ' ')
    .trim()
  return residual.length === 0
}

function nextNonEmpty(lines: string[], from: number): string | undefined {
  for (let i = from; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t) return t
  }
  return undefined
}

/** A header line may list several exercises sharing one set spec ("lat raise,
 *  front delt raise, rear delt" then "3x8lbs each"). */
function headerNames(line: string): string[] {
  return line
    .split(/\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function workoutFromHeader(name: string, sets?: ExerciseSet[]): WorkoutEvent {
  const event: WorkoutEvent = { kind: 'workout', exercise: exerciseName(name) || 'Exercise' }
  const muscleGroups = muscleGroupsFor(name)
  if (muscleGroups.length) event.muscleGroups = muscleGroups
  if (sets && sets.length) {
    event.sets = sets
    const volume = estimateVolumeKg(sets)
    if (volume !== undefined) event.estimatedVolumeKg = volume
  }
  return event
}

/**
 * Parse a whole log into events, understanding logbook structure: an exercise
 * header followed by one or more set lines (including drop sets). Lines that
 * aren't this pattern fall back to clause-level classification, so single-line
 * entries ("bench 3x8, then 5k run") and meals/notes still work.
 */
export function parseLog(rawText: string): StructuredEvent[] {
  const lines = rawText.split(/\r?\n/)
  const events: StructuredEvent[] = []
  let pending: string[] = []

  const flushPending = () => {
    for (const name of pending) events.push(workoutFromHeader(name))
    pending = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (isSetLine(line)) {
      const sets = parseSetLine(line)
      const targets = pending.length ? pending : ['Exercise']
      for (const name of targets) events.push(workoutFromHeader(name, sets))
      pending = []
      continue
    }

    const next = nextNonEmpty(lines, i + 1)
    if (next && isSetLine(next)) {
      // This line names the exercise(s) for the set line(s) that follow.
      flushPending()
      pending = headerNames(line)
      continue
    }

    // A standalone line: classic clause handling (inline sets, meals, notes).
    flushPending()
    for (const clause of splitClauses(line)) events.push(structureClause(clause))
  }

  flushPending()
  return events
}

export const heuristicStructurer: Structurer = {
  id: 'heuristic',
  label: 'Built-in parser',
  isAvailable: () => Promise.resolve(true),
  structure: (rawText: string) => Promise.resolve(parseLog(rawText)),
}
