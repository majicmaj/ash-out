import type { EventLog, MuscleGroup } from '@/db/types'
import { startOfDay } from '@/lib/date'

/**
 * Pure aggregation over structured logs. Everything the insights screen and the
 * muscle-group leaderboard show is derived here, so it can be unit-tested
 * without any UI. Only structured workout/meal events contribute.
 *
 * The leaderboard ranks by weekly **sets per muscle group** — the standard
 * hypertrophy volume metric (≈10–20 sets/week is the common target). Cardio is
 * summarized separately (distance/duration), not ranked as a muscle.
 */

export interface MuscleStat {
  group: MuscleGroup
  sets: number
  volumeKg: number
}

export interface Insights {
  totalSets: number
  totalVolumeKg: number
  totalDistanceM: number
  totalDurationSec: number
  workoutDays: number
  mealCount: number
  /** Non-cardio groups, ranked by sets descending. */
  muscles: MuscleStat[]
}

/** Recommended weekly set range per muscle group, for the leaderboard scale. */
export const OPTIMAL_WEEKLY_SETS = { min: 10, max: 20 } as const

export interface SetTarget {
  min: number
  max: number
}

/**
 * Appropriate weekly working-set range per muscle group (common hypertrophy
 * guidance — large groups tolerate more volume than small ones). Used by the
 * "vs target" insights view. Cardio/other have no set target.
 */
export const WEEKLY_SET_TARGETS: Record<MuscleGroup, SetTarget> = {
  chest: { min: 10, max: 20 },
  back: { min: 10, max: 20 },
  legs: { min: 12, max: 20 },
  shoulders: { min: 8, max: 16 },
  glutes: { min: 8, max: 16 },
  core: { min: 8, max: 16 },
  biceps: { min: 8, max: 14 },
  triceps: { min: 8, max: 14 },
  cardio: { min: 0, max: 0 },
  other: { min: 0, max: 0 },
}

/** The weekly set target for a group, falling back to the generic range. */
export function targetFor(group: MuscleGroup): SetTarget {
  const t = WEEKLY_SET_TARGETS[group]
  return t.max > 0 ? t : OPTIMAL_WEEKLY_SETS
}

export function computeInsights(logs: readonly EventLog[]): Insights {
  const byMuscle = new Map<MuscleGroup, MuscleStat>()
  const workoutDayKeys = new Set<number>()
  let totalSets = 0
  let totalVolumeKg = 0
  let totalDistanceM = 0
  let totalDurationSec = 0
  let mealCount = 0

  for (const log of logs) {
    if (log.status !== 'structured' || !log.structured) continue
    let logHasWorkout = false

    for (const event of log.structured) {
      if (event.kind === 'meal') {
        mealCount++
        continue
      }
      if (event.kind !== 'workout') continue
      logHasWorkout = true

      const groups = event.muscleGroups ?? []
      const isCardio = groups.length === 1 && groups[0] === 'cardio'
      const setCount = event.sets?.length ?? (isCardio ? 0 : 1)

      for (const set of event.sets ?? []) {
        totalDistanceM += set.distanceM ?? 0
        totalDurationSec += set.durationSec ?? 0
      }

      if (isCardio) continue

      totalSets += setCount
      totalVolumeKg += event.estimatedVolumeKg ?? 0
      for (const group of groups) {
        if (group === 'cardio') continue
        const stat = byMuscle.get(group) ?? { group, sets: 0, volumeKg: 0 }
        stat.sets += setCount
        stat.volumeKg += event.estimatedVolumeKg ?? 0
        byMuscle.set(group, stat)
      }
    }

    if (logHasWorkout) workoutDayKeys.add(startOfDay(log.occurredAt))
  }

  const muscles = [...byMuscle.values()].sort((a, b) => b.sets - a.sets || b.volumeKg - a.volumeKg)

  return {
    totalSets,
    totalVolumeKg,
    totalDistanceM,
    totalDurationSec,
    workoutDays: workoutDayKeys.size,
    mealCount,
    muscles,
  }
}

/** Logs whose events happened on or after `since` (epoch ms). */
export function filterSince(logs: readonly EventLog[], since: number): EventLog[] {
  return logs.filter((l) => l.occurredAt >= since)
}
