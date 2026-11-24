// Pure functions for every derived metric. Nothing here touches Firebase or the clock.
import type { Big3Task, Session, Slot, SlotCat, WorkCat } from '../types'

interface PlanActual {
  plan?: Record<string, Slot>
  actual?: Record<string, Slot>
}

/** Plan = reality: matching hours / hours where both plan and actual are set. null when nothing to compare. */
export function planEqualsReality(days: PlanActual[]): number | null {
  let both = 0
  let same = 0
  for (const d of days) {
    for (const [hour, a] of Object.entries(d.actual ?? {})) {
      const p = d.plan?.[hour]
      if (!p) continue
      both++
      if (p.cat === a.cat) same++
    }
  }
  return both === 0 ? null : same / both
}

/** Count of actual slots with a given category across days. */
export function countActual(days: PlanActual[], cat: SlotCat): number {
  let n = 0
  for (const d of days) for (const s of Object.values(d.actual ?? {})) if (s.cat === cat) n++
  return n
}

export function leakedHours(days: PlanActual[]): number {
  return countActual(days, 'leak')
}

/** Sum of session minutes / 60. */
export function focusedHours(sessions: Pick<Session, 'minutes'>[]): number {
  return sessions.reduce((sum, s) => sum + s.minutes, 0) / 60
}

/** Start hour of the 3-hour window (wrapping past midnight) holding the most session starts, or null with no sessions. */
export function peakWindowStart(sessions: Pick<Session, 'start'>[], windowHours = 3): number | null {
  if (sessions.length === 0) return null
  const perHour = new Array<number>(24).fill(0)
  for (const s of sessions) perHour[new Date(s.start).getHours()]++
  let best = 0
  let bestCount = -1
  for (let h = 0; h < 24; h++) {
    let count = 0
    for (let k = 0; k < windowHours; k++) count += perHour[(h + k) % 24]
    if (count > bestCount) {
      bestCount = count
      best = h
    }
  }
  return best
}

/** Hours spent in a work category (actual slots). */
export function hoursSpent(days: PlanActual[], cat: WorkCat): number {
  return countActual(days, cat)
}

export interface LeakPattern {
  hour: number
  days: number
}

/** Rule 1: the same clock hour was a leak on 3+ of the given days. Returns the worst hour. */
export function leakPattern(days: PlanActual[], minDays = 3): LeakPattern | null {
  const perHour = new Array<number>(24).fill(0)
  for (const d of days) {
    for (const [hour, s] of Object.entries(d.actual ?? {})) if (s.cat === 'leak') perHour[Number(hour)]++
  }
  let best: LeakPattern | null = null
  perHour.forEach((count, hour) => {
    if (count >= minDays && (!best || count > best.days)) best = { hour, days: count }
  })
  return best
}

export interface BehindCategory {
  cat: WorkCat
  shortBy: number // hours
}

/** Rule 2: a category is more than 40% behind its weekly budget with 2 or fewer days left. Returns the most behind. */
export function behindCategory(
  spent: Record<string, number>,
  budget: Record<string, number>,
  daysLeft: number,
): BehindCategory | null {
  if (daysLeft > 2) return null
  let best: BehindCategory | null = null
  for (const [cat, planned] of Object.entries(budget)) {
    if (!planned || planned <= 0) continue
    const short = planned - (spent[cat] ?? 0)
    if (short / planned > 0.4 && (!best || short > best.shortBy)) best = { cat: cat as WorkCat, shortBy: short }
  }
  return best
}

/** The category with the biggest shortfall in hours, or null if nobody is behind. Used for the one-line note. */
export function mostBehind(spent: Record<string, number>, budget: Record<string, number>): BehindCategory | null {
  let best: BehindCategory | null = null
  for (const [cat, planned] of Object.entries(budget)) {
    if (!planned || planned <= 0) continue
    const short = planned - (spent[cat] ?? 0)
    if (short > 0 && (!best || short > best.shortBy)) best = { cat: cat as WorkCat, shortBy: short }
  }
  return best
}

export type LoadVerdict = 'good' | 'tight' | 'over'

export interface LoadCheck {
  plannedMin: number
  adjustedHours: number
  freeHours: number
  ratio: number
  verdict: LoadVerdict
}

/** Load check: unfinished big-3 minutes x reality factor vs free work hours left today. */
export function loadCheck(big3: Pick<Big3Task, 'estMin' | 'done'>[], realityFactor: number, freeHours: number): LoadCheck {
  const plannedMin = big3.filter((t) => !t.done).reduce((sum, t) => sum + t.estMin, 0)
  const adjustedHours = (plannedMin / 60) * realityFactor
  const ratio = freeHours > 0 ? adjustedHours / freeHours : adjustedHours > 0 ? Infinity : 0
  const verdict: LoadVerdict = ratio < 0.8 ? 'good' : ratio <= 1 ? 'tight' : 'over'
  return { plannedMin, adjustedHours, freeHours, ratio, verdict }
}
