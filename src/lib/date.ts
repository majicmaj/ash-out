/** Date helpers. All timestamps in the app are epoch milliseconds. */

const DAY_MS = 86_400_000

/** Local midnight for a timestamp, as an epoch-ms key for day grouping. */
export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Human day label: "Today", "Yesterday", or e.g. "Mon, Jun 28". */
export function formatDayLabel(dayStart: number, now: number = Date.now()): string {
  const today = startOfDay(now)
  if (dayStart === today) return 'Today'
  if (dayStart === today - DAY_MS) return 'Yesterday'
  const sameYear = new Date(dayStart).getFullYear() === new Date(now).getFullYear()
  return new Date(dayStart).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** Compact time of day, e.g. "7:30 AM". */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Value for an `<input type="datetime-local">`, in the user's local zone. */
export function toDatetimeLocalValue(ts: number): string {
  const d = new Date(ts - new Date(ts).getTimezoneOffset() * 60_000)
  return d.toISOString().slice(0, 16)
}

/** Parse an `<input type="datetime-local">` value back to epoch ms. */
export function fromDatetimeLocalValue(value: string): number {
  return new Date(value).getTime()
}
