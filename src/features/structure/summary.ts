import type { ExerciseSet, MuscleGroup, StructuredEvent } from '@/db/types'

/**
 * Derive compact, display-ready chips for a log from its structured events.
 * Pure and aggregated per log so the journal shows one tidy row of insight
 * instead of repeating the raw text. Unit tested.
 */
export interface LogSummary {
  muscles: MuscleGroup[]
  metrics: string[]
  hasMeal: boolean
}

export function summarizeLog(structured: StructuredEvent[] | undefined): LogSummary {
  const muscles = new Set<MuscleGroup>()
  let volumeKg = 0
  let distanceM = 0
  let durationSec = 0
  let hasMeal = false

  for (const event of structured ?? []) {
    if (event.kind === 'meal') hasMeal = true
    if (event.kind !== 'workout') continue
    for (const g of event.muscleGroups ?? []) muscles.add(g)
    if (event.estimatedVolumeKg) volumeKg += event.estimatedVolumeKg
    for (const set of event.sets ?? []) {
      if (set.distanceM) distanceM += set.distanceM
      if (set.durationSec) durationSec += set.durationSec
    }
  }

  const metrics: string[] = []
  if (volumeKg > 0) metrics.push(`${formatNumber(volumeKg)} kg volume`)
  if (distanceM > 0) metrics.push(formatDistance(distanceM))
  if (durationSec > 0) metrics.push(formatDuration(durationSec))

  return { muscles: [...muscles], metrics, hasMeal }
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

/** Drop a trailing ".0" so weights read "100" not "100.0", but keep "3.6". */
function formatWeight(kg: number): string {
  return String(Number(kg.toFixed(1)))
}

/** One set as a compact label: "3×100", "8 reps", "60 kg", or a cardio metric. */
export function formatSet(set: ExerciseSet): string {
  if (set.distanceM || set.durationSec) {
    const parts: string[] = []
    if (set.distanceM) parts.push(formatDistance(set.distanceM))
    if (set.durationSec) parts.push(formatDuration(set.durationSec))
    return parts.join(' · ')
  }
  if (set.reps !== undefined && set.weightKg !== undefined)
    return `${set.reps}×${formatWeight(set.weightKg)}`
  if (set.reps !== undefined) return `${set.reps} reps`
  if (set.weightKg !== undefined) return `${formatWeight(set.weightKg)} kg`
  return '—'
}

export function formatDistance(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (m > 0) return `${m} min`
  return `${s}s`
}
