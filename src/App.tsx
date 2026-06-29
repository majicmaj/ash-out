import { useState } from 'react'
import { Header } from '@/components/Header'
import { BottomNav, type Tab } from '@/components/BottomNav'
import { LogComposer } from '@/features/logs/LogComposer'
import { LogList } from '@/features/logs/LogList'
import { SettingsSheet } from '@/features/data/SettingsSheet'
import { InsightsView } from '@/features/insights/InsightsView'
import { useAutoStructure } from '@/features/structure/useAutoStructure'
import { useStructurer } from '@/features/structure/structurerContext'

/** App shell: capture + history under Journal, aggregates under Insights, with
 *  a bottom app bar to switch and settings in a sheet. */
export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('journal')
  const { active } = useStructurer()

  // Structure raw entries in the background with the active engine.
  useAutoStructure(active)

  return (
    <div className="min-h-dvh">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        {tab === 'journal' ? (
          <>
            <LogComposer />
            <div className="mt-8">
              <LogList />
            </div>
          </>
        ) : (
          <InsightsView />
        )}
      </main>

      <BottomNav tab={tab} onChange={setTab} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
