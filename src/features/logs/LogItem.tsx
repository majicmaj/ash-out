import { useState } from 'react'
import type { EventLog } from '@/db/types'
import { Button } from '@/components/Button'
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons'
import { formatTime } from '@/lib/date'
import { LogSummaryChips } from '@/features/structure/LogSummaryChips'
import { LogStructuredView } from './LogStructuredView'
import { LogEditor } from './LogEditor'
import { deleteLog } from './api'

interface LogItemProps {
  log: EventLog
}

/**
 * One journal entry. Read mode shows the time and a clean parsed view (falling
 * back to the raw text until structuring runs); editing happens inline via the
 * structured editor. Controls reveal on hover/focus to keep the timeline calm.
 */
export function LogItem({ log }: LogItemProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')

  if (mode === 'edit') {
    return <LogEditor log={log} onDone={() => setMode('view')} />
  }

  const structured = log.status === 'structured' ? log.structured : undefined

  return (
    <li className="group flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-900/70">
      <time
        className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500"
        dateTime={new Date(log.occurredAt).toISOString()}
      >
        {formatTime(log.occurredAt)}
      </time>

      <div className="min-w-0 flex-1">
        {structured && structured.length > 0 ? (
          <LogStructuredView structured={structured} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-200">
            {log.rawText}
          </p>
        )}
        <LogSummaryChips log={log} />
      </div>

      {mode === 'confirm-delete' ? (
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 text-xs text-slate-400">Delete?</span>
          <Button
            size="sm"
            variant="danger"
            onClick={() => void deleteLog(log.id)}
            aria-label="Confirm delete"
          >
            <CheckIcon width={16} height={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode('view')}
            aria-label="Cancel delete"
          >
            <XIcon width={16} height={16} />
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button size="sm" variant="ghost" onClick={() => setMode('edit')} aria-label="Edit entry">
            <PencilIcon width={16} height={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode('confirm-delete')}
            aria-label="Delete entry"
          >
            <TrashIcon width={16} height={16} />
          </Button>
        </div>
      )}
    </li>
  )
}
