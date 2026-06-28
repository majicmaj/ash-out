import { useState } from 'react'
import type { EventLog } from '@/db/types'
import { Button } from '@/components/Button'
import { Textarea } from '@/components/Textarea'
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons'
import { formatTime } from '@/lib/date'
import { deleteLog, updateLog } from './api'

interface LogItemProps {
  log: EventLog
}

/**
 * One journal entry. Read mode shows the time and the text verbatim; the
 * controls reveal on hover/focus to keep the timeline calm. Editing and
 * deleting are inline so the user never leaves the journal.
 */
export function LogItem({ log }: LogItemProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')

  if (mode === 'edit') {
    return <EditRow log={log} onDone={() => setMode('view')} />
  }

  return (
    <li className="group flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-900/70">
      <time
        className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500"
        dateTime={new Date(log.occurredAt).toISOString()}
      >
        {formatTime(log.occurredAt)}
      </time>

      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-200">
        {log.rawText}
      </p>

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

interface EditRowProps {
  log: EventLog
  onDone: () => void
}

function EditRow({ log, onDone }: EditRowProps) {
  const [text, setText] = useState(log.rawText)

  async function save() {
    const trimmed = text.trim()
    if (trimmed && trimmed !== log.rawText) await updateLog(log.id, { rawText: trimmed })
    onDone()
  }

  return (
    <li className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        aria-label="Edit entry text"
        className="text-[15px] leading-relaxed"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void save()
          }
          if (e.key === 'Escape') onDone()
        }}
      />
      <div className="mt-2 flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={!text.trim()}>
          Save
        </Button>
      </div>
    </li>
  )
}
