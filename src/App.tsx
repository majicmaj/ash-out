import { useState } from 'react'
import { Header } from '@/components/Header'
import { LogComposer } from '@/features/logs/LogComposer'
import { LogList } from '@/features/logs/LogList'
import { SettingsSheet } from '@/features/data/SettingsSheet'
import { useAutoStructure } from '@/features/structure/useAutoStructure'
import { useStructurer } from '@/features/structure/structurerContext'

/** App shell: a single, focused journal screen. Compose at the top, history
 *  below, settings in a sheet. */
export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { active } = useStructurer()

  // Structure raw entries in the background with the active engine.
  useAutoStructure(active)

  return (
    <div className="min-h-dvh">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <LogComposer />
        <div className="mt-8">
          <LogList />
        </div>
      </main>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
