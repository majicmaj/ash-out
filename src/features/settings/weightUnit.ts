import { useEffect, useState } from 'react'

/**
 * The user-wide weight unit. It's a display label, not a conversion: weights are
 * stored as the number the user typed, and this just chooses how they're shown
 * (and labelled in the editor). Persisted in localStorage and broadcast so every
 * component re-renders when it changes.
 */
export type WeightUnit = 'kg' | 'lb'

const KEY = 'ashout.weightUnit'
const EVENT = 'ashout:weightUnit'

export function getWeightUnit(): WeightUnit {
  return localStorage.getItem(KEY) === 'lb' ? 'lb' : 'kg'
}

export function setWeightUnit(unit: WeightUnit): void {
  localStorage.setItem(KEY, unit)
  window.dispatchEvent(new Event(EVENT))
}

/** Live weight unit; updates when changed anywhere (this tab or another). */
export function useWeightUnit(): WeightUnit {
  const [unit, setUnit] = useState<WeightUnit>(getWeightUnit)
  useEffect(() => {
    const sync = () => setUnit(getWeightUnit())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return unit
}
