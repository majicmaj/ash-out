import { useState } from 'react'
import { Header } from '@/components/Header'
import { Segmented } from '@/components/Segmented'
import { LogComposer } from '@/features/logs/LogComposer'
import { LogList } from '@/features/logs/LogList'
import { SettingsSheet } from '@/features/data/SettingsSheet'
import { InsightsView } from '@/features/insights/InsightsView'
import { useAutoStructure } from '@/features/structure/useAutoStructure'
import { useStructurer } from '@/features/structure/structurerContext'

type Tab = 'journal' | 'insights'

const TABS = [
  { value: 'journal' as const, label: 'Journal' },
  { value: 'insights' as const, label: 'Insights' },
]

/** App shell: capture + history under Journal, aggregates under Insights, with
 *  settings in a sheet. */
export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('journal')
  const { active } = useStructurer()

  // Structure raw entries in the background with the active engine.
  useAutoStructure(active)

  return (
    <div className="min-h-dvh">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="mx-auto flex max-w-2xl justify-center px-4 pt-4">
        <Segmented ariaLabel="View" options={TABS} value={tab} onChange={setTab} />
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
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

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
