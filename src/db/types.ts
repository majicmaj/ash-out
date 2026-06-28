/**
 * Core data model.
 *
 * Step 1 only ever reads and writes `rawText`, `occurredAt`, and the timestamps.
 * Everything related to `structured` is declared here so the on-device LLM
 * stage (step 2) and the insights/leaderboard stages (steps 3–4) can populate
 * the same records without a schema migration. Fields the model fills are all
 * optional and absent until processing runs.
 */

/** Lifecycle of a log as it moves through on-device structuring (step 2). */
export type LogStatus = 'raw' | 'processing' | 'structured' | 'failed'

/**
 * A single freeform entry exactly as the user typed it. One submission = one
 * EventLog; multi-line text is preserved verbatim and split per line later.
 */
export interface EventLog {
  id: string
  /** The user's plain-language text, untouched. The source of truth. */
  rawText: string
  /** When the events actually happened. Defaults to createdAt; editable. */
  occurredAt: number
  /** When the entry was first saved (epoch ms). */
  createdAt: number
  /** Last edit time (epoch ms). */
  updatedAt: number
  /** Where this log is in the structuring pipeline. 'raw' until step 2 runs. */
  status: LogStatus
  /** Structured events extracted by the on-device model. Populated in step 2. */
  structured?: StructuredEvent[]
  /** Id of the model that produced `structured`, for reproducibility. */
  modelId?: string
}

// ---------------------------------------------------------------------------
// Structured output — declared now, populated in step 2. Kept intentionally
// small; extend as the extraction prompt/schema matures.
// ---------------------------------------------------------------------------

export type EventKind = 'workout' | 'meal' | 'note'

/** Coarse muscle groups, used by the step 4 leaderboard. */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'cardio'
  | 'other'

export interface ExerciseSet {
  reps?: number
  weightKg?: number
  durationSec?: number
  distanceM?: number
}

export interface WorkoutEvent {
  kind: 'workout'
  /** Normalized exercise name, e.g. "bench press". */
  exercise: string
  sets?: ExerciseSet[]
  muscleGroups?: MuscleGroup[]
  /** Σ reps × weight, derived for insights/leaderboard. */
  estimatedVolumeKg?: number
}

export interface MealEvent {
  kind: 'meal'
  description: string
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
}

export interface NoteEvent {
  kind: 'note'
  text: string
}

/** One atom of meaning extracted from a line of `rawText`. */
export type StructuredEvent = WorkoutEvent | MealEvent | NoteEvent
