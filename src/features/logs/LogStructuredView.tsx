import type { StructuredEvent } from '@/db/types'
import { useWeightUnit } from '@/features/settings/weightUnit'
import { formatSet } from '@/features/structure/summary'

/**
 * The simplified read view of a parsed entry: each exercise on its own line
 * with its sets, meals and notes called out plainly. Replaces showing the raw
 * text blob once structuring has produced something.
 */
export function LogStructuredView({ structured }: { structured: StructuredEvent[] }) {
  const unit = useWeightUnit()
  return (
    <div className="space-y-1">
      {structured.map((event, i) => {
        if (event.kind === 'meal') {
          return (
            <p key={i} className="text-[15px] text-slate-200">
              <span className="mr-1.5 text-emerald-400">●</span>
              {event.description}
            </p>
          )
        }
        if (event.kind === 'note') {
          return (
            <p key={i} className="text-sm italic text-slate-400">
              {event.text}
            </p>
          )
        }
        return (
          <div key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[15px] capitalize text-slate-200">{event.exercise}</span>
            {event.sets?.map((set, si) => (
              <span
                key={si}
                className="rounded bg-slate-800 px-1.5 py-0.5 text-xs tabular-nums text-slate-300"
              >
                {formatSet(set, unit)}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
