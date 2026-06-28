import type { DayGroup } from './grouping'
import { formatDayLabel } from '@/lib/date'
import { LogItem } from './LogItem'

interface LogDayGroupProps {
  group: DayGroup
}

/** A day's heading plus its entries. The heading sticks while scrolling so the
 *  user always knows which day they're reading. */
export function LogDayGroup({ group }: LogDayGroupProps) {
  return (
    <section>
      <h2 className="sticky top-0 z-10 bg-slate-950/90 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 backdrop-blur">
        {formatDayLabel(group.dayStart)}
        <span className="ml-2 font-normal normal-case text-slate-600">
          {group.logs.length} {group.logs.length === 1 ? 'entry' : 'entries'}
        </span>
      </h2>
      <ul className="-mx-3">
        {group.logs.map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </ul>
    </section>
  )
}
