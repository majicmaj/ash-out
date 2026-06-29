import { cn } from '@/lib/cn'
import { JournalIcon, ChartIcon } from './icons'

export type Tab = 'journal' | 'insights'

const TABS = [
  { value: 'journal' as const, label: 'Journal', Icon: JournalIcon },
  { value: 'insights' as const, label: 'Insights', Icon: ChartIcon },
]

/**
 * Fixed bottom navigation — a phone-style app bar so switching views is within
 * thumb reach. Uses tab semantics and respects the device's safe-area inset.
 */
export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      role="tablist"
      aria-label="View"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-2xl">
        {TABS.map(({ value, label, Icon }) => {
          const active = tab === value
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(value)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-accent' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Icon width={22} height={22} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
