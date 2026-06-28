import { useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/Button'
import { Textarea } from '@/components/Textarea'
import { PlusIcon } from '@/components/icons'
import { createLog } from './api'

const PLACEHOLDER = `Log anything, in your own words…
e.g. "bench press 3x8 at 60kg, then 5k run"
or "oatmeal with banana and coffee for breakfast"`

/**
 * The primary action of step 1: capture a freeform entry with as little
 * friction as possible. One textarea, ⌘/Ctrl+Enter to save, auto-clears and
 * refocuses so several things can be logged in a row.
 */
export function LogComposer() {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const canSave = text.trim().length > 0 && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    try {
      const created = await createLog({ rawText: text })
      if (created) {
        setText('')
        ref.current?.focus()
      }
    } finally {
      setSaving(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void save()
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/20 focus-within:border-slate-700">
      <Textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER}
        aria-label="New log entry"
        autoFocus
        className="min-h-[3.5rem] text-base leading-relaxed"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-sans">⌘</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-sans">↵</kbd>
          <span className="ml-1.5">to save</span>
        </span>
        <Button onClick={() => void save()} disabled={!canSave}>
          <PlusIcon width={18} height={18} />
          {saving ? 'Saving…' : 'Log it'}
        </Button>
      </div>
    </div>
  )
}
