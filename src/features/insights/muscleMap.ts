import type { ExtendedBodyPart, Slug } from 'react-muscle-highlighter'
import type { MuscleGroup } from '@/db/types'
import { OPTIMAL_WEEKLY_SETS, type MuscleStat } from './aggregate'

/**
 * Bridges our coarse {@link MuscleGroup}s to the anatomical SVG slugs the body
 * chart understands, and turns weekly set counts into colour intensities. Pure
 * and unit-tested so the `<MuscleMap>` component stays a thin renderer.
 *
 * Groups with no anatomical region on the model (`cardio`, `other`) map to an
 * empty slug list and simply don't highlight anything.
 */
export const MUSCLE_SLUGS: Record<MuscleGroup, Slug[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  shoulders: ['deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  legs: ['quadriceps', 'hamstring', 'calves', 'adductors', 'tibialis'],
  glutes: ['gluteal'],
  core: ['abs', 'obliques'],
  cardio: [],
  other: [],
}

/**
 * Heat ramp fed to the body chart as its `colors` array. Intensity is a 1-based
 * index into this, so level 1 → first colour. Amber climbs toward the same
 * emerald the leaderboard uses for "on target", keeping the two views coherent.
 */
export const INTENSITY_COLORS = ['#92400e', '#d97706', '#f59e0b', '#10b981'] as const

/** Fill for muscles with no logged volume in the window — reads as body, not blank. */
export const MUSCLE_BASE_FILL = '#334155'

/**
 * Intensity bucket (1–4, a 1-based index into {@link INTENSITY_COLORS}) for a
 * group's set count. In the weekly view the scale is anchored to the
 * recommended target so hitting it lights up emerald (level 4), matching the
 * leaderboard. Other windows use a relative ramp against the busiest group and
 * never reach the "on target" colour, since the target is weekly.
 */
export function intensityFor(sets: number, weekly: boolean, maxSets: number): number {
  if (sets <= 0) return 0
  if (weekly) {
    if (sets >= OPTIMAL_WEEKLY_SETS.min) return 4
    const ratio = sets / OPTIMAL_WEEKLY_SETS.min
    if (ratio >= 0.66) return 3
    if (ratio >= 0.33) return 2
    return 1
  }
  const ratio = maxSets > 0 ? sets / maxSets : 0
  if (ratio >= 0.66) return 3
  if (ratio >= 0.33) return 2
  return 1
}

/**
 * Expands ranked muscle stats into the flat `ExtendedBodyPart[]` the chart
 * renders — one entry per anatomical slug, carrying the group's intensity.
 * Groups that don't map to a body region are skipped.
 */
export function bodyPartsFromMuscles(
  muscles: readonly MuscleStat[],
  weekly: boolean,
): ExtendedBodyPart[] {
  const maxSets = muscles.reduce((m, s) => Math.max(m, s.sets), 0)
  const parts: ExtendedBodyPart[] = []
  for (const stat of muscles) {
    const intensity = intensityFor(stat.sets, weekly, maxSets)
    if (intensity === 0) continue
    for (const slug of MUSCLE_SLUGS[stat.group]) {
      parts.push({ slug, intensity })
    }
  }
  return parts
}
