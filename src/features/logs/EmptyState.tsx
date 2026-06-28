import { LogoIcon } from '@/components/icons'

/** Shown when there are no logs yet. Concrete examples teach the freeform
 *  format faster than instructions do. */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 rounded-2xl bg-slate-900 p-4 text-accent">
        <LogoIcon width={32} height={32} />
      </div>
      <h2 className="text-lg font-semibold text-slate-200">Start your journal</h2>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        Jot down workouts and meals however you like — Ashout makes sense of them later.
      </p>
      <ul className="mt-5 space-y-2 text-left text-sm text-slate-500">
        <li className="rounded-lg bg-slate-900/60 px-3 py-2">“squats 5x5 @ 80kg, felt strong”</li>
        <li className="rounded-lg bg-slate-900/60 px-3 py-2">“grilled chicken salad + rice”</li>
        <li className="rounded-lg bg-slate-900/60 px-3 py-2">“30 min easy bike, zone 2”</li>
      </ul>
    </div>
  )
}
