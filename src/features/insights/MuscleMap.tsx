import { useState } from 'react'
import Body from 'react-muscle-highlighter'
import { Segmented } from '@/components/Segmented'
import type { MuscleStat } from './aggregate'
import type { TimeWindow } from './hooks'
import {
  bodyPartsFromMuscles,
  INTENSITY_COLORS,
  MUSCLE_BASE_FILL,
} from './muscleMap'

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
 * Anatomical companion to the leaderboard: highlights the muscles trained in the
 * window, shaded by how much volume they got. The set-count → colour mapping is
 * the pure {@link bodyPartsFromMuscles}; this component only renders and toggles
 * front/back and body model.
 */
export function MuscleMap({ muscles, window }: { muscles: MuscleStat[]; window: TimeWindow }) {
  const [side, setSide] = useState<Side>('front')
  const [gender, setGender] = useState<Gender>('male')

  const data = bodyPartsFromMuscles(muscles, window === 'week')
  if (data.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-300">Muscles worked</h3>
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

      <Legend weekly={window === 'week'} />
    </section>
  )
}

/** Reads the heat ramp left-to-right; labels differ since "on target" is weekly. */
function Legend({ weekly }: { weekly: boolean }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
      <span>{weekly ? 'Building' : 'Less'}</span>
      <div className="flex overflow-hidden rounded-full">
        {INTENSITY_COLORS.map((c) => (
          <span key={c} className="h-2.5 w-6" style={{ backgroundColor: c }} />
        ))}
      </div>
      <span>{weekly ? 'On target' : 'More'}</span>
    </div>
  )
}
