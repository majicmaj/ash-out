import type { ReactNode } from 'react'
import type { EventLog } from '@/db/types'
import { cn } from '@/lib/cn'
import { summarizeLog } from './summary'

type Tone = 'muscle' | 'meal' | 'metric'

const toneClass: Record<Tone, string> = {
  muscle: 'bg-accent/15 text-amber-300',
  meal: 'bg-emerald-500/15 text-emerald-300',
  metric: 'bg-slate-800 text-slate-400',
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', toneClass[tone])}>
      {children}
    </span>
  )
}

/**
 * The derived insight for a log: muscle-group tags, a meal marker, and metric
 * pills (volume / distance / duration). Renders only once structuring has run
 * and produced something worth showing.
 */
export function LogSummaryChips({ log }: { log: EventLog }) {
  if (log.status !== 'structured') return null

  const { muscles, metrics, hasMeal } = summarizeLog(log.structured)
  if (muscles.length === 0 && metrics.length === 0 && !hasMeal) return null

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {muscles.map((m) => (
        <Pill key={m} tone="muscle">
          {m}
        </Pill>
      ))}
      {hasMeal && <Pill tone="meal">meal</Pill>}
      {metrics.map((m) => (
        <Pill key={m} tone="metric">
          {m}
        </Pill>
      ))}
    </div>
  )
}
