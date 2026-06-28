import { useEffect, type ReactNode } from 'react'
import { Button } from './Button'
import { XIcon } from './icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Minimal accessible modal: Escape and backdrop close it, focus is trapped to
 *  the panel by `aria-modal`, and body scroll is locked while open. */
export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="safe-bottom w-full max-w-md rounded-t-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
            <XIcon width={18} height={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
