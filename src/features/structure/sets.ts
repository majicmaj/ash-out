import type { ExerciseSet } from '@/db/types'
import { parseWeightKg, weightToKg } from './measures'

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

/**
 * Above this, the second number in "A x B" is read as a weight, not reps —
 * almost nobody does 30+ reps a set, but plenty of machine stacks weigh more.
 */
const REPS_PLAUSIBLE_MAX = 30

export type SetNotation = 'sets_reps' | 'reps_weight'

interface SetPair {
  a: number
  b: number
  unit?: string
}

/** Strip parenthetical and connector annotations like "(break)", "rest", "drop". */
function stripAnnotations(item: string): string {
  return item
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(break|rest|drop\s*set|drop|superset|each|to\s*failure|amrap)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const PAIR_RE = /(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(kgs?|kilos?|lbs?|pounds?)?/i

/**
 * Decide whether "A x B" items mean sets×reps (e.g. `3x8`) or reps×weight
 * (e.g. a drop set `3x100, 3x85`). The signals, in order:
 *   1. a weight unit on B (`8lbs`) → reps×weight
 *   2. a separate weight on the line (`3x8 @ 60kg`) → sets×reps at that weight
 *   3. an implausible rep count (B > 30) or a descending B series → reps×weight
 *   4. otherwise the classic sets×reps
 */
export function detectNotation(pairs: SetPair[], line: string): SetNotation {
  if (pairs.some((p) => p.unit)) return 'reps_weight'
  if (parseWeightKg(line) !== undefined) return 'sets_reps'
  const maxB = Math.max(...pairs.map((p) => p.b))
  const distinct = new Set(pairs.map((p) => p.b)).size
  const descending = pairs.length >= 2 && distinct > 1 && pairs.every((p, i) => i === 0 || p.b <= pairs[i - 1].b)
  return maxB > REPS_PLAUSIBLE_MAX || descending ? 'reps_weight' : 'sets_reps'
}

/**
 * Parse a full set line — one or more comma/semicolon-separated items, possibly
 * a drop set — into one {@link ExerciseSet} per working set. Auto-detects the
 * notation (see {@link detectNotation}). Falls back to {@link parseSets} for a
 * bare weight or rep count with no "A x B" pattern. Returns undefined when
 * there's nothing strength-like to extract.
 */
export function parseSetLine(line: string): ExerciseSet[] | undefined {
  const pairs: SetPair[] = []
  for (const raw of line.split(/\s*[,;]\s*/)) {
    const item = stripAnnotations(raw)
    if (!item) continue
    const m = item.match(PAIR_RE)
    if (m) pairs.push({ a: parseInt(m[1], 10), b: parseFloat(m[2]), unit: m[3]?.toLowerCase() })
  }
  if (pairs.length === 0) return parseSets(line)

  const notation = detectNotation(pairs, line)
  if (notation === 'reps_weight') {
    return pairs.map((p) => makeSet(p.a, p.unit ? weightToKg(p.b, p.unit) : p.b))
  }

  const weightKg = parseWeightKg(line)
  return pairs.flatMap((p) =>
    p.a > 0 && p.a <= 50 ? Array.from({ length: p.a }, () => makeSet(p.b, weightKg)) : [makeSet(p.b, weightKg)],
  )
}
