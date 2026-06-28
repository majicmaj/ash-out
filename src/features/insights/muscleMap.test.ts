import { describe, expect, it } from 'vitest'
import type { MuscleStat } from './aggregate'
import { bodyPartsFromMuscles, intensityFor, MUSCLE_SLUGS } from './muscleMap'

const stat = (group: MuscleStat['group'], sets: number): MuscleStat => ({
  group,
  sets,
  volumeKg: 0,
})

describe('intensityFor', () => {
  it('returns 0 for no sets', () => {
    expect(intensityFor(0, true, 20)).toBe(0)
  })

  it('weekly: lights up emerald (4) once the target is met', () => {
    expect(intensityFor(10, true, 30)).toBe(4)
    expect(intensityFor(25, true, 30)).toBe(4)
  })

  it('weekly: ramps below target relative to the recommended minimum', () => {
    expect(intensityFor(1, true, 30)).toBe(1) // ~10%
    expect(intensityFor(4, true, 30)).toBe(2) // 40%
    expect(intensityFor(7, true, 30)).toBe(3) // 70%
  })

  it('non-weekly: relative ramp that never reaches the weekly-only emerald', () => {
    expect(intensityFor(10, false, 10)).toBe(3)
    expect(intensityFor(5, false, 10)).toBe(2)
    expect(intensityFor(1, false, 10)).toBe(1)
  })
})

describe('bodyPartsFromMuscles', () => {
  it('expands a group into all its anatomical slugs with the same intensity', () => {
    const parts = bodyPartsFromMuscles([stat('back', 12)], true)
    expect(parts.map((p) => p.slug).sort()).toEqual([...MUSCLE_SLUGS.back].sort())
    expect(parts.every((p) => p.intensity === 4)).toBe(true)
  })

  it('skips groups with no logged sets and groups with no body region', () => {
    const parts = bodyPartsFromMuscles([stat('chest', 0), stat('cardio', 99)], true)
    expect(parts).toEqual([])
  })

  it('scales non-weekly intensity against the busiest group', () => {
    const parts = bodyPartsFromMuscles([stat('chest', 8), stat('biceps', 2)], false)
    const chest = parts.find((p) => p.slug === 'chest')
    const biceps = parts.find((p) => p.slug === 'biceps')
    expect(chest?.intensity).toBe(3)
    expect(biceps?.intensity).toBe(1)
  })
})
