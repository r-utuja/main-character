import { describe, expect, it } from 'vitest'
import {
  behindCategory,
  focusedHours,
  leakPattern,
  leakedHours,
  loadCheck,
  mostBehind,
  peakWindowStart,
  planEqualsReality,
} from './metrics'

const slot = (cat: 'college' | 'leak' | 'sleep' | 'startup') => ({ cat })

describe('planEqualsReality', () => {
  it('is null with nothing to compare (divide by zero)', () => {
    expect(planEqualsReality([])).toBeNull()
    expect(planEqualsReality([{ plan: { '1': slot('college') } }])).toBeNull()
  })
  it('counts only hours where both are set', () => {
    const day = {
      plan: { '9': slot('college'), '10': slot('college'), '11': slot('startup') },
      actual: { '9': slot('college'), '10': slot('leak'), '12': slot('college') },
    }
    expect(planEqualsReality([day])).toBe(0.5)
  })
})

describe('leakedHours / focusedHours', () => {
  it('counts leak slots', () => {
    expect(leakedHours([{ actual: { '1': slot('leak'), '2': slot('college'), '3': slot('leak') } }, {}])).toBe(2)
  })
  it('sums minutes into hours and handles empty', () => {
    expect(focusedHours([{ minutes: 25 }, { minutes: 35 }])).toBe(1)
    expect(focusedHours([])).toBe(0)
  })
})

describe('peakWindowStart', () => {
  const at = (h: number) => ({ start: new Date(2026, 10, 20, h, 10).getTime() })
  it('is null with no sessions', () => {
    expect(peakWindowStart([])).toBeNull()
  })
  it('finds the busiest 3-hour window, wrapping midnight', () => {
    expect(peakWindowStart([at(22), at(23), at(0), at(0), at(10)])).toBe(22)
  })
})

describe('leakPattern', () => {
  const leakAt = (h: number) => ({ actual: { [String(h)]: slot('leak') } })
  it('needs 3 days on the same hour', () => {
    expect(leakPattern([leakAt(16), leakAt(16), leakAt(9)])).toBeNull()
    expect(leakPattern([leakAt(16), leakAt(16), leakAt(16)])).toEqual({ hour: 16, days: 3 })
  })
})

describe('behindCategory / mostBehind', () => {
  const budget = { college: 20, placement: 10 }
  it('stays quiet when more than 2 days remain', () => {
    expect(behindCategory({ college: 0, placement: 0 }, budget, 3)).toBeNull()
  })
  it('fires when over 40% behind with 2 or fewer days left', () => {
    expect(behindCategory({ college: 18, placement: 5 }, budget, 2)).toEqual({ cat: 'placement', shortBy: 5 })
    expect(behindCategory({ college: 18, placement: 7 }, budget, 2)).toBeNull()
  })
  it('ignores zero budgets', () => {
    expect(behindCategory({}, { college: 0 }, 1)).toBeNull()
    expect(mostBehind({}, { college: 0 })).toBeNull()
  })
  it('names the biggest shortfall', () => {
    expect(mostBehind({ college: 14, placement: 6 }, budget)).toEqual({ cat: 'college', shortBy: 6 })
  })
})

describe('loadCheck', () => {
  const task = (estMin: number, done = false) => ({ estMin, done })
  it('good under 80%', () => {
    expect(loadCheck([task(60)], 1.4, 7).verdict).toBe('good')
  })
  it('tight between 80% and 100%', () => {
    const r = loadCheck([task(270)], 1.4, 7)
    expect(r.adjustedHours).toBeCloseTo(6.3)
    expect(r.verdict).toBe('tight')
  })
  it('over above 100%, and with no free time left', () => {
    expect(loadCheck([task(330)], 1.4, 7).verdict).toBe('over')
    expect(loadCheck([task(30)], 1.4, 0).verdict).toBe('over')
  })
  it('ignores done tasks and handles zero/zero', () => {
    expect(loadCheck([task(300, true)], 1.4, 0)).toMatchObject({ plannedMin: 0, ratio: 0, verdict: 'good' })
  })
})
