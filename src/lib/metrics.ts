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

export interface PlanBlock {
  hours: number[] // clock hours, in day order
  cat: SlotCat
  label: string
  ifThen?: string
}

/** Group the plan into runs of consecutive hours (in day order) with the same category and label. */
export function planBlocks(plan: Record<string, Slot>, order: number[]): PlanBlock[] {
  const blocks: PlanBlock[] = []
  for (const h of order) {
    const s = plan[String(h)]
    if (!s) continue
    const last = blocks[blocks.length - 1]
    const label = s.label ?? ''
    if (last && last.cat === s.cat && last.label === label && order.indexOf(last.hours[last.hours.length - 1]) === order.indexOf(h) - 1) {
      last.hours.push(h)
      if (!last.ifThen && s.ifThen) last.ifThen = s.ifThen
    } else {
      blocks.push({ hours: [h], cat: s.cat, label, ifThen: s.ifThen })
    }
  }
  return blocks
}

/** Free work hours left today: hours remaining in the day that are not planned as sleep. */
export function freeHoursLeft(plan: Record<string, Slot>, order: number[], nowHour: number, nowMinutes: number): number {
  const pos = order.indexOf(nowHour)
  if (pos < 0) return 0
  let free = (60 - nowMinutes) / 60
  if (plan[String(nowHour)]?.cat === 'sleep') free = 0
  for (let i = pos + 1; i < order.length; i++) if (plan[String(order[i])]?.cat !== 'sleep') free++
  return free
}

export interface HabitDay {
  habits?: Record<string, 'full' | 'tiny'>
  mvd?: boolean
  mvdDone?: boolean[]
}

function anyDone(d: HabitDay): boolean {
  return Object.keys(d.habits ?? {}).length > 0 || (d.mvdDone ?? []).some(Boolean)
}

/**
 * Habit streak: consecutive days done. One missed day is forgiven (never miss twice); two misses in a row end it.
 * Today not being done yet never breaks it. An MVD day with at least one habit or MVD task done protects every streak.
 * `getDay(offset)` returns the day doc `offset` days before today (0 = today), or undefined if there is none.
 */
export function habitStreak(habitId: string, getDay: (offset: number) => HabitDay | undefined, maxDays = 60): number {
  let streak = 0
  let misses = 0
  for (let i = 0; i < maxDays; i++) {
    const d = getDay(i) ?? {}
    if (d.habits?.[habitId]) {
      streak++
      misses = 0
    } else if (i === 0) {
      continue
    } else if (d.mvd && anyDone(d)) {
      continue
    } else if (++misses >= 2) {
      break
    }
  }
  return streak
}

/** True when yesterday was a real miss for this habit (so today shows "save it"). */
export function missedYesterday(habitId: string, getDay: (offset: number) => HabitDay | undefined): boolean {
  const y = getDay(1)
  if (!y) return false
  if (y.habits?.[habitId]) return false
  if (y.mvd && anyDone(y)) return false
  // only a miss if there was a streak to save
  return habitStreak(habitId, (o) => getDay(o + 1)) > 0
}

// ---- sprints, tickets, epics ----
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Priority, Sprint, Ticket } from '../types'

type TicketLite = Pick<Ticket, 'status' | 'points'> & Partial<Pick<Ticket, 'due' | 'priority' | 'doneAt' | 'epicId'>>

export interface SprintPoints {
  committed: number
  done: number
  review: number
  progress: number
  todo: number
}

/** Story points per column for the tickets of one sprint. */
export function sprintPoints(tickets: TicketLite[]): SprintPoints {
  const out: SprintPoints = { committed: 0, done: 0, review: 0, progress: 0, todo: 0 }
  for (const t of tickets) {
    out.committed += t.points
    out[t.status] += t.points
  }
  return out
}

/** Day number inside the sprint (1-based), clamped to 1..length. */
export function sprintDay(startKey: string, todayKey: string, length: number): number {
  const d = differenceInCalendarDays(parseISO(todayKey), parseISO(startKey)) + 1
  return Math.min(Math.max(1, d), Math.max(1, length))
}

/** Mean completedPoints of the last 3 closed sprints, or null when there is no history. */
export function velocity(sprints: Pick<Sprint, 'number' | 'status' | 'completedPoints'>[]): number | null {
  const closed = sprints
    .filter((s) => s.status === 'closed')
    .sort((a, b) => b.number - a.number)
    .slice(0, 3)
  if (closed.length === 0) return null
  return closed.reduce((sum, s) => sum + (s.completedPoints ?? 0), 0) / closed.length
}

/** How many points over the average velocity the sprint is, or null when it is within it (or there is no history). */
export function velocityOverage(committed: number, avg: number | null): number | null {
  if (avg === null) return null
  const over = Math.round(committed - avg)
  return over > 0 ? over : null
}

export interface Burndown {
  committed: number
  /** remaining points at the end of each sprint day up to today (index 0 = day 1) */
  remaining: number[]
  /** ideal line: committed at day 1 start falling to 0 on the last day, one value per day */
  ideal: number[]
}

/** Remaining points per day: committed minus points of tickets done on or before that day. */
export function burndown(
  tickets: Pick<Ticket, 'points' | 'doneAt'>[],
  startKey: string,
  length: number,
  todayKey: string,
  keyOf: (ms: number) => string,
): Burndown {
  const committed = tickets.reduce((s, t) => s + t.points, 0)
  const len = Math.max(1, length)
  const today = sprintDay(startKey, todayKey, len)
  const remaining: number[] = []
  for (let i = 0; i < today; i++) {
    const dayKeyStr = new Date(parseISO(startKey).getTime())
    dayKeyStr.setDate(dayKeyStr.getDate() + i)
    const key = `${dayKeyStr.getFullYear()}-${String(dayKeyStr.getMonth() + 1).padStart(2, '0')}-${String(dayKeyStr.getDate()).padStart(2, '0')}`
    const doneBy = tickets.filter((t) => t.doneAt !== undefined && keyOf(t.doneAt) <= key).reduce((s, t) => s + t.points, 0)
    remaining.push(committed - doneBy)
  }
  const ideal = Array.from({ length: len }, (_, i) => (len === 1 ? 0 : committed * (1 - i / (len - 1))))
  return { committed, remaining, ideal }
}

/** Done tickets / all tickets in an epic (0 when the epic is empty). */
export function epicProgress(tickets: Pick<Ticket, 'status'>[]): number {
  if (tickets.length === 0) return 0
  return tickets.filter((t) => t.status === 'done').length / tickets.length
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2 }
export function priorityRank(p: Priority): number {
  return PRIORITY_RANK[p]
}

/** Urgent = due within 3 days (including already past). */
export function isUrgent(due: string | undefined, todayKey: string): boolean {
  if (!due) return false
  return differenceInCalendarDays(parseISO(due), parseISO(todayKey)) <= 3
}

/** Important = priority high or medium. */
export function isImportant(priority: Priority): boolean {
  return priority !== 'low'
}

export type Quadrant = 'do' | 'plan' | 'squeeze' | 'later'

export function quadrantOf(t: Pick<Ticket, 'due' | 'priority'>, todayKey: string): Quadrant {
  const u = isUrgent(t.due, todayKey)
  const i = isImportant(t.priority)
  return u && i ? 'do' : i ? 'plan' : u ? 'squeeze' : 'later'
}

// ---- money ----
import { getDaysInMonth } from 'date-fns'

/** INR with Indian digit grouping: 7450 -> ₹7,450, 123456 -> ₹1,23,456. */
export function formatINR(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0)
  return (v < 0 ? '-₹' : '₹') + Math.abs(v).toLocaleString('en-IN')
}

export function sumAmounts(list: { amount: number }[]): number {
  return list.reduce((s, e) => s + e.amount, 0)
}

/** Days left in the month including today. */
export function daysLeftInMonth(todayKey: string): number {
  const d = parseISO(todayKey)
  return getDaysInMonth(d) - d.getDate() + 1
}

/** Share of the month already gone (0 to 1), counting today as gone. */
export function monthGone(todayKey: string): number {
  const d = parseISO(todayKey)
  return d.getDate() / getDaysInMonth(d)
}

/** Safe to spend per day = (monthly budget - spent this month) / days left including today. Never negative. */
export function safeToSpend(monthlyBudget: number, spentThisMonth: number, daysLeft: number): number {
  if (daysLeft <= 0) return 0
  return Math.max(0, Math.round((monthlyBudget - spentThisMonth) / daysLeft))
}

/** On track while the share of budget used is no ahead of the share of the month gone. */
export function budgetVerdict(spent: number, monthlyBudget: number, gone: number): 'on track' | 'running hot' {
  if (monthlyBudget <= 0) return 'on track'
  return spent / monthlyBudget <= gone ? 'on track' : 'running hot'
}

/** Totals per category. */
export function categoryTotals(list: { cat: string; amount: number }[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of list) out[e.cat] = (out[e.cat] ?? 0) + e.amount
  return out
}

/** The category taking over 30% of the month's spending, if any (the biggest one). */
export function spendNudge(totals: Record<string, number>): { cat: string; pct: number } | null {
  const total = Object.values(totals).reduce((s, n) => s + n, 0)
  if (total <= 0) return null
  let best: { cat: string; pct: number } | null = null
  for (const [cat, amount] of Object.entries(totals)) {
    const pct = (amount / total) * 100
    if (pct > 30 && (!best || pct > best.pct)) best = { cat, pct }
  }
  return best
}
