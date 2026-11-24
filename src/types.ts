// All Firestore document types. Everything lives under users/{uid}.

export type WorkCat = 'college' | 'placement' | 'exploration' | 'startup' | 'other'
export type SlotCat = WorkCat | 'sleep' | 'leak'
export type Priority = 'high' | 'med' | 'low'
export type TicketStatus = 'todo' | 'progress' | 'review' | 'done'
export type TimerMode = 'focus' | 'short' | 'long'

export interface PomodoroSettings {
  focus: number
  short: number
  long: number
  longEvery: number
  dailyGoal: number
}

export interface ActiveTimer {
  mode: TimerMode
  endsAt?: number // ms, while running
  remainingMs?: number // while paused
  session: number // 1-4
  taskId?: string
  cat?: WorkCat
}

export interface UserDoc {
  name: string
  email: string
  createdAt: number
  dayStartHour: number
  pomodoro: PomodoroSettings
  weeklyBudgetHours: Record<'college' | 'placement' | 'exploration' | 'startup', number>
  monthlyBudget: number
  mvdTasks: [string, string, string]
  realityFactor: number
  sprintLengthDays: number
  wipLimit: number
  ticketCounters: Record<'COL' | 'PLC' | 'EXP' | 'STR' | 'OTH', number>
  activeTimer?: ActiveTimer | null
}

export interface Slot {
  cat: SlotCat
  label?: string
  ifThen?: string
}

export interface Big3Task {
  id: string
  title: string
  cat: WorkCat
  estMin: number
  done: boolean
  ticketId?: string
}

export interface DayDoc {
  plan: Record<string, Slot>
  actual: Record<string, Slot>
  big3: Big3Task[]
  mvd: boolean
  mvdDone: boolean[]
  habits: Record<string, 'full' | 'tiny'>
  journal: { win: string; lesson: string; tomorrow: string }
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  tiny: string
  order: number
  archived: boolean
}

export interface Subtask {
  text: string
  done: boolean
}

export interface Ticket {
  id: string
  key: string
  title: string
  cat: WorkCat
  points: number
  priority: Priority
  status: TicketStatus
  sprintId?: string
  epicId?: string
  due?: string
  blocked: boolean
  blockedReason: string
  subtasks: Subtask[]
  createdAt: number
  doneAt?: number
}

export interface Sprint {
  id: string
  number: number
  start: string
  end: string
  goal: string
  status: 'active' | 'closed'
  completedPoints?: number
}

export interface Epic {
  id: string
  name: string
  cat: WorkCat
  due: string
}

export interface Session {
  id: string
  date: string
  start: number
  end: number
  minutes: number
  taskTitle: string
  cat: WorkCat
  ticketId?: string
}

export interface Expense {
  id: string
  date: string
  ts: number
  amount: number
  cat: string
  note: string
}

export interface Parked {
  id: string
  text: string
  createdAt: number
  cleared: boolean
}

export interface WeekDoc {
  worked: string
  didnt: string
  change: string
}

export type DayRow = Partial<DayDoc> & { id: string }
