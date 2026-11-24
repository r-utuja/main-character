import type { Habit, SlotCat, UserDoc, WorkCat } from '../types'

export const WORK_CATS: WorkCat[] = ['college', 'placement', 'exploration', 'startup', 'other']
export const SLOT_CATS: SlotCat[] = [...WORK_CATS, 'sleep', 'leak']

export const CAT_COLORS: Record<SlotCat, string> = {
  college: '#B8A6FF',
  placement: '#86CBFF',
  exploration: '#FF8FB8',
  startup: '#FFA36C',
  other: '#8F87A0',
  sleep: '#2A2631',
  leak: '#FFA36C',
}

export const MONEY_CATS = [
  'food & cafés',
  'transport',
  'subscriptions',
  'shopping',
  'outings',
  'study stuff',
  'other',
]

export function defaultUserDoc(name: string, email: string): UserDoc {
  return {
    name,
    email,
    createdAt: Date.now(),
    dayStartHour: 0,
    pomodoro: { focus: 25, short: 5, long: 15, longEvery: 4, dailyGoal: 8 },
    weeklyBudgetHours: { college: 20, placement: 10, exploration: 6, startup: 10 },
    monthlyBudget: 10000,
    mvdTasks: ['10 min of piano', 'drink water + eat properly', 'one tiny task'],
    realityFactor: 1.4,
    sprintLengthDays: 14,
    wipLimit: 3,
    ticketCounters: { COL: 0, PLC: 0, EXP: 0, STR: 0, OTH: 0 },
    activeTimer: null,
  }
}

export const STARTER_HABITS: Omit<Habit, 'id'>[] = [
  { name: 'move', icon: 'move', color: '#CDF56A', tiny: '10-min walk', order: 0, archived: false },
  { name: 'breathe', icon: 'breathe', color: '#B8A6FF', tiny: '3 breaths', order: 1, archived: false },
  { name: 'piano', icon: 'piano', color: '#FF8FB8', tiny: '1 song', order: 2, archived: false },
  { name: 'language', icon: 'language', color: '#86CBFF', tiny: '5 words', order: 3, archived: false },
  { name: 'read', icon: 'read', color: '#FFA36C', tiny: '1 page', order: 4, archived: false },
]
