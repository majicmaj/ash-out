/**
 * Pure parsers for the quantities people write in workout notes. Each function
 * scans free text and returns a normalized number (metric) or undefined.
 * Deliberately small and individually unit-tested.
 */

const LB_TO_KG = 0.45359237
const MILE_TO_M = 1609.34

const round1 = (n: number) => Math.round(n * 10) / 10

/** Convert a numeric weight to kg, given an optional unit token. No unit means
 *  the number is taken as-is (kg, or a unitless machine-stack value). */
export function weightToKg(value: number, unit?: string): number {
  const u = unit?.toLowerCase()
  const kg = u && (u.startsWith('lb') || u.startsWith('pound')) ? value * LB_TO_KG : value
  return round1(kg)
}

/** Weight in kg from "60kg", "60 kg", "135lb", "135 lbs". Returns kg. */
export function parseWeightKg(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(kgs?|kilos?|lbs?|pounds?)\b/i)
  if (!m) return undefined
  return weightToKg(parseFloat(m[1]), m[2])
}

/** Distance in metres from "5k", "5km", "800m", "3mi", "3 miles". */
export function parseDistanceM(text: string): number | undefined {
  const m = text.match(
    /(\d+(?:\.\d+)?)\s*(kms?|kilomet(?:er|re)s?|k|mi|miles?|m|met(?:er|re)s?)\b/i,
  )
  if (!m) return undefined
  const value = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit === 'k' || unit.startsWith('km') || unit.startsWith('kilomet'))
    return Math.round(value * 1000)
  if (unit === 'mi' || unit.startsWith('mile')) return Math.round(value * MILE_TO_M)
  return Math.round(value) // metres
}

/**
 * Duration in seconds, summing "1h", "30 min", "45s" found in the text.
 * Bare "m" is intentionally NOT minutes — it means metres (see parseDistanceM),
 * so minutes must be written "min"/"minute(s)". This keeps "800m" unambiguous.
 */
export function parseDurationSec(text: string): number | undefined {
  let total = 0
  let found = false
  for (const m of text.matchAll(
    /(\d+(?:\.\d+)?)\s*(h|hrs?|hours?|mins?|minutes?|s|secs?|seconds?)\b/gi,
  )) {
    const value = parseFloat(m[1])
    const unit = m[2].toLowerCase()
    if (unit === 'h' || unit.startsWith('hr') || unit.startsWith('hour')) total += value * 3600
    else if (unit === 's' || unit.startsWith('sec')) total += value
    else total += value * 60 // minutes
    found = true
  }
  return found ? Math.round(total) : undefined
}
