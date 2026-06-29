import type { EventLog, ExerciseSet, MuscleGroup } from '@/db/types'

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

/** A single set's strength score (estimated 1RM, Epley) for PR comparison. */
function setScore(set: ExerciseSet): number {
  const weight = set.weightKg
  if (weight === undefined || weight <= 0) return 0
  const reps = set.reps && set.reps > 0 ? set.reps : 1
  return weight * (1 + reps / 30)
}

export interface MusclePR {
  /** Best strength in window ÷ all-time best (0–1). 1 means a PR was matched. */
  ratio: number
  /** The window's best matched or beat the all-time best for the group. */
  hitPR: boolean
}

/**
 * Per-muscle-group PR status for the body map: did training inside the window
 * [from, to) match the all-time best for any exercise hitting the group? Each
 * exercise's in-window best is compared to its all-time best (estimated 1RM),
 * then rolled up to its muscle groups, taking the group's strongest result.
 */
export function computeMusclePRs(
  logs: readonly EventLog[],
  from: number,
  to = Infinity,
): Map<MuscleGroup, MusclePR> {
  interface Ex {
    all: number
    win: number
    groups: Set<MuscleGroup>
  }
  const byExercise = new Map<string, Ex>()

  for (const log of logs) {
    if (log.status !== 'structured' || !log.structured) continue
    for (const event of log.structured) {
      if (event.kind !== 'workout' || !event.sets) continue
      const score = Math.max(0, ...event.sets.map(setScore))
      if (score <= 0) continue

      const key = event.exercise.trim().toLowerCase()
      const ex = byExercise.get(key) ?? { all: 0, win: 0, groups: new Set<MuscleGroup>() }
      ex.all = Math.max(ex.all, score)
      if (log.occurredAt >= from && log.occurredAt < to) ex.win = Math.max(ex.win, score)
      for (const g of event.muscleGroups ?? []) if (g !== 'cardio') ex.groups.add(g)
      byExercise.set(key, ex)
    }
  }

  const result = new Map<MuscleGroup, MusclePR>()
  for (const ex of byExercise.values()) {
    if (ex.win <= 0) continue // not trained in window
    const ratio = ex.all > 0 ? ex.win / ex.all : 0
    for (const group of ex.groups) {
      const current = result.get(group)
      if (!current || ratio > current.ratio) {
        result.set(group, { ratio, hitPR: ratio >= 0.999 })
      }
    }
  }
  return result
}

export interface DayExercise {
  exercise: string
  /** Top set of the day (by estimated 1RM). */
  weightKg: number
  reps: number
  /** Best estimated 1RM that day, and the all-time best to compare against. */
  est1RM: number
  prEst1RM: number
  /** The day matched or beat the all-time best for this exercise. */
  hitPR: boolean
  volumeKg: number
}

/**
 * A single day's lifts compared to all-time PRs, for the PRs tab. For each
 * exercise trained in [from, to) it reports the day's top set and estimated
 * 1RM against the exercise's best ever. PRs first, then heaviest.
 */
export function computeDayComparison(
  logs: readonly EventLog[],
  from: number,
  to: number,
): DayExercise[] {
  const allBest = new Map<string, number>()
  for (const log of logs) {
    if (log.status !== 'structured' || !log.structured) continue
    for (const event of log.structured) {
      if (event.kind !== 'workout' || !event.sets) continue
      const score = Math.max(0, ...event.sets.map(setScore))
      if (score > 0) {
        const key = event.exercise.trim().toLowerCase()
        allBest.set(key, Math.max(allBest.get(key) ?? 0, score))
      }
    }
  }

  interface Day {
    display: string
    weightKg: number
    reps: number
    est1RM: number
    volumeKg: number
  }
  const day = new Map<string, Day>()
  for (const log of logs) {
    if (log.status !== 'structured' || !log.structured) continue
    if (log.occurredAt < from || log.occurredAt >= to) continue
    for (const event of log.structured) {
      if (event.kind !== 'workout' || !event.sets) continue
      const key = event.exercise.trim().toLowerCase()
      const d = day.get(key) ?? { display: event.exercise.trim(), weightKg: 0, reps: 0, est1RM: 0, volumeKg: 0 }
      for (const set of event.sets) {
        const score = setScore(set)
        if (score > d.est1RM) {
          d.est1RM = score
          d.weightKg = set.weightKg ?? 0
          d.reps = set.reps ?? 0
        }
      }
      d.volumeKg += event.estimatedVolumeKg ?? 0
      if (d.est1RM > 0) day.set(key, d)
    }
  }

  const out: DayExercise[] = []
  for (const [key, d] of day) {
    const pr = allBest.get(key) ?? d.est1RM
    out.push({
      exercise: d.display,
      weightKg: d.weightKg,
      reps: d.reps,
      est1RM: Math.round(d.est1RM),
      prEst1RM: Math.round(pr),
      hitPR: d.est1RM >= pr * 0.999,
      volumeKg: Math.round(d.volumeKg),
    })
  }
  out.sort((a, b) => Number(b.hitPR) - Number(a.hitPR) || b.est1RM - a.est1RM)
  return out
}
