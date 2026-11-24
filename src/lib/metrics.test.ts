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

import { freeHoursLeft, habitStreak, missedYesterday, planBlocks } from './metrics'

describe('planBlocks', () => {
  const order = Array.from({ length: 24 }, (_, i) => i)
  it('groups consecutive hours with the same cat and label', () => {
    const plan = { '9': { cat: 'college' as const, label: 'study' }, '10': { cat: 'college' as const, label: 'study' }, '12': { cat: 'other' as const } }
    const blocks = planBlocks(plan, order)
    expect(blocks).toHaveLength(2)
    expect(blocks[0].hours).toEqual([9, 10])
  })
  it('handles an empty plan', () => {
    expect(planBlocks({}, order)).toEqual([])
  })
})

describe('freeHoursLeft', () => {
  const order = Array.from({ length: 24 }, (_, i) => i)
  it('counts the rest of the current hour plus later non-sleep hours', () => {
    expect(freeHoursLeft({}, order, 22, 30)).toBeCloseTo(1.5)
  })
  it('skips hours planned as sleep', () => {
    expect(freeHoursLeft({ '23': { cat: 'sleep' } }, order, 22, 0)).toBeCloseTo(1)
  })
  it('is 0 at the end of the day', () => {
    expect(freeHoursLeft({}, order, 23, 60)).toBe(0)
  })
})

describe('habitStreak', () => {
  const done = { habits: { h: 'full' as const } }
  const make = (days: Array<typeof done | { mvd?: boolean; habits?: Record<string, 'full' | 'tiny'> } | undefined>) => (o: number) => days[o]
  it('counts consecutive done days; today not done yet does not break it', () => {
    expect(habitStreak('h', make([undefined, done, done, done]))).toBe(3)
    expect(habitStreak('h', make([done, done]))).toBe(2)
  })
  it('forgives a single miss but not two', () => {
    expect(habitStreak('h', make([done, undefined, done, done]))).toBe(3)
    expect(habitStreak('h', make([done, undefined, undefined, done, done]))).toBe(1)
  })
  it('is 0 with no data', () => {
    expect(habitStreak('h', make([]))).toBe(0)
  })
  it('an MVD day with something done protects the streak', () => {
    const mvd = { mvd: true, habits: { other: 'tiny' as const } }
    expect(habitStreak('h', make([done, mvd, undefined, done]))).toBe(2)
  })
})

describe('missedYesterday', () => {
  const done = { habits: { h: 'full' as const } }
  it('is true when a streak existed before a miss yesterday', () => {
    expect(missedYesterday('h', (o) => (o === 1 ? {} : o >= 2 && o < 5 ? done : undefined))).toBe(true)
  })
  it('is false when yesterday was done or there was no streak', () => {
    expect(missedYesterday('h', (o) => (o === 1 ? done : undefined))).toBe(false)
    expect(missedYesterday('h', () => undefined)).toBe(false)
  })
})

import { burndown, epicProgress, isUrgent, quadrantOf, sprintDay, sprintPoints, velocity, velocityOverage } from './metrics'

describe('sprints', () => {
  it('sums points per column', () => {
    const pts = sprintPoints([
      { status: 'done', points: 3 },
      { status: 'progress', points: 5 },
      { status: 'review', points: 2 },
      { status: 'todo', points: 1 },
    ])
    expect(pts).toEqual({ committed: 11, done: 3, review: 2, progress: 5, todo: 1 })
    expect(sprintPoints([]).committed).toBe(0)
  })
  it('sprintDay is clamped', () => {
    expect(sprintDay('2026-11-23', '2026-11-24', 14)).toBe(2)
    expect(sprintDay('2026-11-23', '2026-12-30', 14)).toBe(14)
    expect(sprintDay('2026-11-23', '2026-11-01', 14)).toBe(1)
  })
  it('velocity averages the last 3 closed sprints', () => {
    const s = (number: number, completedPoints: number, status: 'closed' | 'active' = 'closed') => ({ number, completedPoints, status })
    expect(velocity([])).toBeNull()
    expect(velocity([s(1, 20), s(2, 30), s(3, 40), s(4, 50), s(5, 99, 'active')])).toBe(40)
  })
  it('overage only above the average', () => {
    expect(velocityOverage(35, 31)).toBe(4)
    expect(velocityOverage(30, 31)).toBeNull()
    expect(velocityOverage(35, null)).toBeNull()
  })
})

describe('burndown', () => {
  const keyOf = (ms: number) => {
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const tickets = [
    { points: 5, doneAt: new Date(2026, 10, 24, 10).getTime() },
    { points: 3, doneAt: undefined },
  ]
  it('remaining drops on the day a ticket is done', () => {
    const b = burndown(tickets, '2026-11-23', 14, '2026-11-24', keyOf)
    expect(b.committed).toBe(8)
    expect(b.remaining).toEqual([8, 3])
  })
  it('ideal line goes from committed to zero', () => {
    const b = burndown(tickets, '2026-11-23', 14, '2026-11-24', keyOf)
    expect(b.ideal).toHaveLength(14)
    expect(b.ideal[0]).toBe(8)
    expect(b.ideal[13]).toBe(0)
  })
  it('handles an empty sprint and a one-day sprint', () => {
    expect(burndown([], '2026-11-23', 1, '2026-11-23', keyOf)).toEqual({ committed: 0, remaining: [0], ideal: [0] })
  })
})

describe('epics and eisenhower', () => {
  it('epic progress handles empty epics', () => {
    expect(epicProgress([])).toBe(0)
    expect(epicProgress([{ status: 'done' }, { status: 'todo' }])).toBe(0.5)
  })
  it('urgent means due within 3 days', () => {
    expect(isUrgent('2026-11-27', '2026-11-24')).toBe(true)
    expect(isUrgent('2026-11-28', '2026-11-24')).toBe(false)
    expect(isUrgent(undefined, '2026-11-24')).toBe(false)
  })
  it('quadrants', () => {
    const t = '2026-11-24'
    expect(quadrantOf({ due: '2026-11-25', priority: 'high' }, t)).toBe(
'do')
    expect(quadrantOf({ due: '2026-12-25', priority: 'med' }, t)).toBe('plan')
    expect(quadrantOf({ due: '2026-11-25', priority: 'low' }, t)).toBe('squeeze')
    expect(quadrantOf({ priority: 'low' }, t)).toBe('later')
  })
})

import { budgetVerdict, categoryTotals, daysLeftInMonth, formatINR, monthGone, safeToSpend, spendNudge, sumAmounts } from './metrics'

describe('money', () => {
  it('formats INR with Indian grouping', () => {
    expect(formatINR(7450)).toBe('₹7,450')
    expect(formatINR(123456)).toBe('₹1,23,456')
    expect(formatINR(0)).toBe('₹0')
    expect(formatINR(Number.NaN)).toBe('₹0')
  })
  it('sums amounts', () => {
    expect(sumAmounts([])).toBe(0)
    expect(sumAmounts([{ amount: 100 }, { amount: 80 }])).toBe(180)
  })
  it('counts days left including today', () => {
    expect(daysLeftInMonth('2026-11-24')).toBe(7)
    expect(daysLeftInMonth('2026-11-30')).toBe(1)
  })
  it('safe to spend divides what is left by days left', () => {
    expect(safeToSpend(10000, 7450, 7)).toBe(364)
    expect(safeToSpend(10000, 12000, 7)).toBe(0)
    expect(safeToSpend(10000, 0, 0)).toBe(0)
  })
  it('verdict compares budget used to month gone', () => {
    expect(budgetVerdict(7450, 10000, monthGone('2026-11-24'))).toBe('on track')
    expect(budgetVerdict(9000, 10000, 0.5)).toBe('running hot')
    expect(budgetVerdict(100, 0, 0.5)).toBe('on track')
  })
  it('nudges when one category passes 30% of the month', () => {
    const totals = categoryTotals([{ cat: 'food', amount: 2310 }, { cat: 'shopping', amount: 1450 }, { cat: 'transport', amount: 3690 }])
    expect(spendNudge(totals)?.cat).toBe('transport')
    expect(spendNudge({ a: 30, b: 30, c: 40 })?.cat).toBe('c')
    expect(spendNudge({ a: 30, b: 30, c: 30, d: 10 })).toBeNull()
    expect(spendNudge({})).toBeNull()
  })
})
