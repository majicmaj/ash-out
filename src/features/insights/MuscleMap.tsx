import { useState } from 'react'
import Body from 'react-muscle-highlighter'
import type { MuscleGroup } from '@/db/types'
import { Segmented } from '@/components/Segmented'
import type { MuscleStat } from './aggregate'
import type { TimeWindow } from './hooks'
import type { MuscleMetric } from './MuscleLeaderboard'
import type { MusclePR } from './records'
import { bodyPartsFromMuscles, bodyPartsFromPRs, INTENSITY_COLORS, MUSCLE_BASE_FILL } from './muscleMap'

type Side = 'front' | 'back'
type Gender = 'male' | 'female'

const SIDE_OPTIONS = [
  { value: 'front' as const, label: 'Front' },
  { value: 'back' as const, label: 'Back' },
]
const GENDER_OPTIONS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
]

/**
 * Anatomical companion to the leaderboard. In volume mode it shades each muscle
 * by how much it was trained; in PR mode (`metric === 'pr'`) a muscle turns
 * green once the window matched or beat its personal record. Colour mapping is
 * the pure {@link bodyPartsFromMuscles} / {@link bodyPartsFromPRs}; this only
 * renders and toggles front/back and body model.
 */
export function MuscleMap({
  muscles,
  window,
  metric,
  musclePRs,
}: {
  muscles: MuscleStat[]
  window: TimeWindow
  metric: MuscleMetric
  musclePRs?: Map<MuscleGroup, MusclePR>
}) {
  const [side, setSide] = useState<Side>('front')
  const [gender, setGender] = useState<Gender>('male')

  const prMode = metric === 'pr'
  const data = prMode
    ? bodyPartsFromPRs(musclePRs ?? new Map())
    : bodyPartsFromMuscles(muscles, window === 'week')
  if (data.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-300">
          {prMode ? 'PR progress' : 'Muscles worked'}
        </h3>
        <div className="flex gap-2">
          <Segmented ariaLabel="Body model" options={GENDER_OPTIONS} value={gender} onChange={setGender} size="sm" />
          <Segmented ariaLabel="Body side" options={SIDE_OPTIONS} value={side} onChange={setSide} size="sm" />
        </div>
      </div>

      <div className="flex justify-center rounded-2xl bg-slate-900/40 py-4">
        <Body
          data={data}
          side={side}
          gender={gender}
          scale={1.1}
          colors={[...INTENSITY_COLORS]}
          defaultFill={MUSCLE_BASE_FILL}
          border="none"
        />
      </div>

      <Legend mode={prMode ? 'pr' : window === 'week' ? 'week' : 'volume'} />
    </section>
  )
}

const LEGEND_LABELS = {
  pr: ['Below PR', 'Hit PR ★'],
  week: ['Building', 'On target'],
  volume: ['Less', 'More'],
} as const

/** Reads the heat ramp left-to-right; labels depend on the active mode. */
function Legend({ mode }: { mode: keyof typeof LEGEND_LABELS }) {
  const [low, high] = LEGEND_LABELS[mode]
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
      <span>{low}</span>
      <div className="flex overflow-hidden rounded-full">
        {INTENSITY_COLORS.map((c) => (
          <span key={c} className="h-2.5 w-6" style={{ backgroundColor: c }} />
        ))}
      </div>
      <span>{high}</span>
    </div>
  )
}
