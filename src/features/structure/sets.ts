import type { ExerciseSet } from '@/db/types'
import { parseWeightKg } from './measures'

/**
 * Parse strength set/rep/weight notation from a clause into one ExerciseSet per
 * working set. Handles "3x8", "3 x 8 @ 60kg", "5x5", "8 reps", and a bare weight.
 * Returns undefined when there's nothing strength-like to extract.
 */
export function parseSets(text: string): ExerciseSet[] | undefined {
  const weightKg = parseWeightKg(text)

  const grid = text.match(/(\d+)\s*[xX×]\s*(\d+)/)
  if (grid) {
    const count = parseInt(grid[1], 10)
    const reps = parseInt(grid[2], 10)
    if (count > 0 && count <= 50) {
      return Array.from({ length: count }, () => makeSet(reps, weightKg))
    }
  }

  const repsMatch = text.match(/(\d+)\s*reps?\b/i)
  const reps = repsMatch ? parseInt(repsMatch[1], 10) : undefined
  if (reps !== undefined || weightKg !== undefined) {
    return [makeSet(reps, weightKg)]
  }
  return undefined
}

function makeSet(reps: number | undefined, weightKg: number | undefined): ExerciseSet {
  const set: ExerciseSet = {}
  if (reps !== undefined) set.reps = reps
  if (weightKg !== undefined) set.weightKg = weightKg
  return set
}

/** Σ reps × weight across sets; undefined when no loaded reps exist. */
export function estimateVolumeKg(sets: ExerciseSet[]): number | undefined {
  const volume = sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weightKg ?? 0), 0)
  return volume > 0 ? Math.round(volume) : undefined
}
