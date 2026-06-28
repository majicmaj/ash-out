import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { DownloadIcon, UploadIcon, TrashIcon } from '@/components/icons'
import { datedFilename, downloadTextFile, pickTextFile } from '@/lib/file'
import { useLogCount } from '@/features/logs/hooks'
import { clearAllLogs } from '@/features/logs/api'
import { exportLogs, importLogs } from './transfer'

interface SettingsSheetProps {
  open: boolean
  onClose: () => void
}

/** Data ownership + a preview of what's coming. Everything here operates purely
 *  on the local device. */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const count = useLogCount()
  const [message, setMessage] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  async function handleExport() {
    const json = await exportLogs()
    downloadTextFile(datedFilename('ashout-backup', 'json'), json)
    setMessage('Backup downloaded.')
  }

  async function handleImport() {
    const text = await pickTextFile()
    if (text === null) return
    try {
      const { imported } = await importLogs(text)
      setMessage(`Imported ${imported} ${imported === 1 ? 'entry' : 'entries'}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  async function handleClear() {
    await clearAllLogs()
    setConfirmClear(false)
    setMessage('All entries deleted.')
  }

  return (
    <Modal open={open} title="Data & settings" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        {count ?? 0} {count === 1 ? 'entry' : 'entries'} stored on this device. Nothing leaves your
        browser.
      </p>

      <div className="space-y-2">
        <Row label="Export a backup" desc="Download every entry as a JSON file.">
          <Button size="sm" variant="ghost" onClick={() => void handleExport()}>
            <DownloadIcon width={16} height={16} />
            Export
          </Button>
        </Row>

        <Row label="Import a backup" desc="Merge entries from a previous export.">
          <Button size="sm" variant="ghost" onClick={() => void handleImport()}>
            <UploadIcon width={16} height={16} />
            Import
          </Button>
        </Row>

        <Row label="Delete everything" desc="Permanently remove all entries.">
          {confirmClear ? (
            <div className="flex gap-1">
              <Button size="sm" variant="danger" onClick={() => void handleClear()}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmClear(true)}>
              <TrashIcon width={16} height={16} />
              Delete
            </Button>
          )}
        </Row>
      </div>

      {message && (
        <p
          className="mt-4 rounded-lg bg-slate-800/70 px-3 py-2 text-sm text-slate-300"
          role="status"
        >
          {message}
        </p>
      )}

      <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coming next</p>
        <p className="mt-1 text-sm text-slate-400">
          On-device AI will turn these notes into structured workouts and meals, then surface
          insights and muscle-group leaderboards — all without a server.
        </p>
      </div>
    </Modal>
  )
}

function Row({
  label,
  desc,
  children,
}: {
  label: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/40 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="truncate text-xs text-slate-500">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
