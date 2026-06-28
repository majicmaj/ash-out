import { useState } from 'react'
import type { EventLog, ExerciseSet, StructuredEvent } from '@/db/types'
import { Button } from '@/components/Button'
import { Textarea } from '@/components/Textarea'
import { PlusIcon, TrashIcon } from '@/components/icons'
import { updateLog, updateLogStructured } from './api'

const numCls =
  'w-14 rounded-md bg-slate-800 px-2 py-1 text-sm tabular-nums text-slate-100 outline-none focus:ring-1 focus:ring-accent'
const textCls =
  'w-full rounded-md bg-slate-800 px-2 py-1 text-[15px] text-slate-100 outline-none focus:ring-1 focus:ring-accent'

/**
 * Inline editor for a past entry. Editing works on the parsed structure — each
 * set is its own reps×weight row you can adjust or delete — so corrections are
 * granular and never re-parse. An escape hatch re-opens the original text, which
 * re-parses from scratch on save. Notes/meals fall back to text editing.
 */
export function LogEditor({ log, onDone }: { log: EventLog; onDone: () => void }) {
  const initial = log.structured ?? []
  const [events, setEvents] = useState<StructuredEvent[]>(() =>
    initial.map((e) => ({ ...e, ...(e.kind === 'workout' ? { sets: e.sets?.map((s) => ({ ...s })) } : {}) })),
  )
  const [editText, setEditText] = useState(initial.length === 0)
  const [text, setText] = useState(log.rawText)

  const patchEvent = (i: number, next: StructuredEvent) =>
    setEvents((evs) => evs.map((e, j) => (j === i ? next : e)))
  const removeEvent = (i: number) => setEvents((evs) => evs.filter((_, j) => j !== i))

  async function save() {
    if (editText) {
      const trimmed = text.trim()
      if (trimmed && trimmed !== log.rawText) await updateLog(log.id, { rawText: trimmed })
    } else {
      await updateLogStructured(log.id, events)
    }
    onDone()
  }

  return (
    <li className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
      {editText ? (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          aria-label="Edit entry text"
          className="text-[15px] leading-relaxed"
        />
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => (
            <EventEditor
              key={i}
              event={event}
              onChange={(next) => patchEvent(i, next)}
              onRemove={() => removeEvent(i)}
            />
          ))}
          {events.length === 0 && (
            <p className="text-sm text-slate-500">Nothing parsed. Edit the original text instead.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          onClick={() => setEditText((v) => !v)}
        >
          {editText ? 'Edit parsed sets' : 'Edit original text'}
        </button>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void save()}>
            Save
          </Button>
        </div>
      </div>
    </li>
  )
}

function EventEditor({
  event,
  onChange,
  onRemove,
}: {
  event: StructuredEvent
  onChange: (next: StructuredEvent) => void
  onRemove: () => void
}) {
  if (event.kind !== 'workout') {
    const value = event.kind === 'meal' ? event.description : event.text
    return (
      <div className="flex items-center gap-2">
        <input
          className={textCls}
          value={value}
          aria-label={`Edit ${event.kind}`}
          onChange={(e) =>
            onChange(
              event.kind === 'meal'
                ? { ...event, description: e.target.value }
                : { ...event, text: e.target.value },
            )
          }
        />
        <RemoveButton label="Remove" onClick={onRemove} />
      </div>
    )
  }

  const sets = event.sets ?? []
  const setSets = (next: ExerciseSet[]) => onChange({ ...event, sets: next })
  const patchSet = (i: number, patch: Partial<ExerciseSet>) =>
    setSets(sets.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  return (
    <div className="rounded-lg bg-slate-800/40 p-2">
      <div className="mb-1.5 flex items-center gap-2">
        <input
          className={textCls + ' capitalize'}
          value={event.exercise}
          aria-label="Exercise name"
          onChange={(e) => onChange({ ...event, exercise: e.target.value })}
        />
        <RemoveButton label="Remove exercise" onClick={onRemove} />
      </div>

      <div className="space-y-1.5">
        {sets.map((set, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="number"
              inputMode="numeric"
              className={numCls}
              value={set.reps ?? ''}
              aria-label={`Set ${i + 1} reps`}
              placeholder="reps"
              onChange={(e) => patchSet(i, { reps: toNum(e.target.value) })}
            />
            <span>×</span>
            <input
              type="number"
              inputMode="decimal"
              className={numCls}
              value={set.weightKg ?? ''}
              aria-label={`Set ${i + 1} weight`}
              placeholder="wt"
              onChange={(e) => patchSet(i, { weightKg: toNum(e.target.value) })}
            />
            <RemoveButton
              label={`Delete set ${i + 1}`}
              onClick={() => setSets(sets.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        onClick={() => setSets([...sets, { ...(sets[sets.length - 1] ?? {}) }])}
      >
        <PlusIcon width={14} height={14} /> Add set
      </button>
    </div>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-red-300"
    >
      <TrashIcon width={15} height={15} />
    </button>
  )
}

function toNum(value: string): number | undefined {
  if (value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
