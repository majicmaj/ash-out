import { Button } from './Button'
import { LogoIcon, SettingsIcon } from './icons'

interface HeaderProps {
  onOpenSettings: () => void
}

/** Top bar: brand on the left, settings on the right. Sticks to the top. */
export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-accent">
            <LogoIcon width={22} height={22} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-100">Ashout</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenSettings} aria-label="Data & settings">
          <SettingsIcon width={20} height={20} />
        </Button>
      </div>
    </header>
  )
}
