/**
 * Pure parsers for the quantities people write in workout notes. Each function
 * scans free text and returns a normalized number (metric) or undefined.
 * Deliberately small and individually unit-tested.
 */

const MILE_TO_M = 1609.34

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * The weight number written in "60kg", "60 kg", "135lb", "8lbs". The unit word
 * is only used to recognise it as a weight — the number is kept as typed, since
 * the display unit is a single user-wide choice (see settings/weightUnit), not
 * a per-entry conversion. Machine-stack numbers have no real unit anyway.
 */
export function parseWeight(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(kgs?|kilos?|lbs?|pounds?)\b/i)
  if (!m) return undefined
  return round1(parseFloat(m[1]))
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
