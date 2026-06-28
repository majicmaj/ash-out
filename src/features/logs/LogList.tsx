import { useLogGroups } from './hooks'
import { LogDayGroup } from './LogDayGroup'
import { EmptyState } from './EmptyState'

/** The journal: every entry grouped by day, newest first. Distinguishes the
 *  initial load from a genuinely empty journal. */
export function LogList() {
  const groups = useLogGroups()

  if (groups === undefined) {
    return <p className="px-3 py-8 text-center text-sm text-slate-500">Loading…</p>
  }

  if (groups.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <LogDayGroup key={group.dayStart} group={group} />
      ))}
    </div>
  )
}
