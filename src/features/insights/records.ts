import type { EventLog } from '@/db/types'

/**
 * Per-exercise personal records, derived from all structured history. Where the
 * muscle leaderboard answers "am I training each group enough?" (set count),
 * records answer "am I getting stronger?" — the part that progresses while set
 * counts stay flat. A record counts as set "in window" when its all-time best
 * was achieved on or after `since`, so the UI can flag a fresh PR.
 */
export interface ExerciseRecord {
  exercise: string
  /** Heaviest loaded set, and the reps performed at that weight. */
  bestWeightKg: number
  bestReps: number
  /** Estimated one-rep max (Epley), the single best strength indicator. */
  est1RM: number
  /** Best single-session volume (Σ reps × weight) for the exercise. */
  bestVolumeKg: number
  /** A weight, 1RM, or volume best was achieved within the selected window. */
  prInWindow: boolean
  lastAt: number
}

interface Acc {
  display: string
  weightKg: number
  reps: number
  weightAt: number
  orm: number
  ormAt: number
  volumeKg: number
  volumeAt: number
  lastAt: number
}

export function computeRecords(logs: readonly EventLog[], since: number): ExerciseRecord[] {
  const byExercise = new Map<string, Acc>()

  for (const log of logs) {
    if (log.status !== 'structured' || !log.structured) continue
    for (const event of log.structured) {
      if (event.kind !== 'workout' || !event.sets) continue
      const loaded = event.sets.filter((s) => s.weightKg !== undefined && s.weightKg > 0)
      if (loaded.length === 0) continue // bodyweight / cardio: no load to PR

      const key = event.exercise.trim().toLowerCase()
      const acc =
        byExercise.get(key) ??
        ({
          display: event.exercise.trim(),
          weightKg: 0,
          reps: 0,
          weightAt: 0,
          orm: 0,
          ormAt: 0,
          volumeKg: 0,
          volumeAt: 0,
          lastAt: 0,
        } satisfies Acc)

      const at = log.occurredAt
      acc.lastAt = Math.max(acc.lastAt, at)

      for (const set of loaded) {
        const weight = set.weightKg as number
        const reps = set.reps ?? 0
        if (weight > acc.weightKg || (weight === acc.weightKg && reps > acc.reps)) {
          acc.weightKg = weight
          acc.reps = reps
          acc.weightAt = at
        }
        if (reps > 0) {
          const oneRm = weight * (1 + reps / 30)
          if (oneRm > acc.orm) {
            acc.orm = oneRm
            acc.ormAt = at
          }
        }
      }

      const volume = event.estimatedVolumeKg ?? 0
      if (volume > acc.volumeKg) {
        acc.volumeKg = volume
        acc.volumeAt = at
      }

      byExercise.set(key, acc)
    }
  }

  const records: ExerciseRecord[] = []
  for (const acc of byExercise.values()) {
    if (acc.lastAt < since) continue // not trained in this window
    const prInWindow = since > 0 && Math.max(acc.weightAt, acc.ormAt, acc.volumeAt) >= since
    records.push({
      exercise: acc.display,
      bestWeightKg: acc.weightKg,
      bestReps: acc.reps,
      est1RM: Math.round(acc.orm),
      bestVolumeKg: acc.volumeKg,
      prInWindow,
      lastAt: acc.lastAt,
    })
  }

  // Fresh PRs first, then most recently trained.
  records.sort((a, b) => Number(b.prInWindow) - Number(a.prInWindow) || b.lastAt - a.lastAt)
  return records
}
