import { describe, expect, it } from 'vitest'
import { dayKey, formatDuration, formatTime, isoWeek } from './dates'

describe('dayKey', () => {
  it('uses the calendar date when day starts at 00:00', () => {
    expect(dayKey(new Date(2026, 10, 24, 0, 30), 0)).toBe('2026-11-24')
  })
  it('keeps early hours in the previous day when day starts later', () => {
    expect(dayKey(new Date(2026, 10, 24, 3, 0), 5)).toBe('2026-11-23')
    expect(dayKey(new Date(2026, 10, 24, 5, 0), 5)).toBe('2026-11-24')
  })
})

describe('isoWeek', () => {
  it('formats ISO weeks', () => {
    expect(isoWeek(new Date(2026, 10, 24))).toBe('2026-W48')
  })
  it('uses the ISO week-year at year boundaries', () => {
    expect(isoWeek(new Date(2026, 0, 1))).toBe('2026-W01')
    expect(isoWeek(new Date(2027, 0, 1))).toBe('2026-W53')
  })
})

describe('formatTime / formatDuration', () => {
  it('is 24h', () => {
    expect(formatTime(new Date(2026, 10, 24, 15, 5))).toBe('15:05')
  })
  it('formats durations and clamps negatives', () => {
    expect(formatDuration(13 * 3600000 + 60000)).toBe('13h 01m')
    expect(formatDuration(-5)).toBe('0h 00m')
  })
})
