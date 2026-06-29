import { afterEach, describe, expect, it } from 'vitest'
import { getWeightUnit, setWeightUnit } from './weightUnit'
import { formatSet } from '@/features/structure/summary'

afterEach(() => localStorage.clear())

describe('weight unit preference', () => {
  it('defaults to kg and round-trips a choice', () => {
    expect(getWeightUnit()).toBe('kg')
    setWeightUnit('lb')
    expect(getWeightUnit()).toBe('lb')
  })
})

describe('formatSet with a unit', () => {
  it('labels a bare weight with the chosen unit, no conversion', () => {
    expect(formatSet({ weightKg: 100 }, 'lb')).toBe('100 lb')
    expect(formatSet({ weightKg: 100 }, 'kg')).toBe('100 kg')
  })

  it('shows reps×weight compactly without a unit suffix', () => {
    expect(formatSet({ reps: 3, weightKg: 100 }, 'lb')).toBe('3×100')
  })
})
