import { describe, it, expect } from 'vitest'
import { parseWeightKg, parseDistanceM, parseDurationSec } from './measures'

describe('parseWeightKg', () => {
  it('parses kg', () => {
    expect(parseWeightKg('bench 60kg')).toBe(60)
    expect(parseWeightKg('60 kg')).toBe(60)
    expect(parseWeightKg('squat 82.5 kg')).toBe(82.5)
  })

  it('converts pounds to kg', () => {
    expect(parseWeightKg('135 lb')).toBe(61.2)
    expect(parseWeightKg('225 lbs')).toBe(102.1)
  })

  it('returns undefined when no weight', () => {
    expect(parseWeightKg('5k run')).toBeUndefined()
  })
})

describe('parseDistanceM', () => {
  it('parses k / km as kilometres', () => {
    expect(parseDistanceM('5k run')).toBe(5000)
    expect(parseDistanceM('10km bike')).toBe(10000)
  })

  it('parses metres', () => {
    expect(parseDistanceM('800m repeats')).toBe(800)
  })

  it('parses miles', () => {
    expect(parseDistanceM('3 miles')).toBe(4828)
  })

  it('does not treat minutes as distance', () => {
    expect(parseDistanceM('30 min easy')).toBeUndefined()
  })
})

describe('parseDurationSec', () => {
  it('parses minutes, hours, seconds', () => {
    expect(parseDurationSec('30 min')).toBe(1800)
    expect(parseDurationSec('1h')).toBe(3600)
    expect(parseDurationSec('45s plank')).toBe(45)
  })

  it('sums multiple units', () => {
    expect(parseDurationSec('1h 30 min')).toBe(5400)
  })

  it('does not treat bare metres as minutes', () => {
    expect(parseDurationSec('800m')).toBeUndefined()
  })

  it('returns undefined when no duration', () => {
    expect(parseDurationSec('bench 3x8')).toBeUndefined()
  })
})
