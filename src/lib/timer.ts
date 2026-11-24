// Pure timer maths. The timer never counts down a number: remaining time is always endsAt - now.
import type { ActiveTimer, PomodoroSettings, TimerMode } from '../types'

export function modeMs(mode: TimerMode, pomo: PomodoroSettings): number {
  const minutes = mode === 'focus' ? pomo.focus : mode === 'short' ? pomo.short : pomo.long
  return Math.max(1, minutes) * 60000
}

export function idleTimer(mode: TimerMode = 'focus', session = 1): ActiveTimer {
  return { mode, session }
}

export function isRunning(t: ActiveTimer): boolean {
  return typeof t.endsAt === 'number'
}

/** Milliseconds left: running -> endsAt - now, paused -> remainingMs, idle -> the full length. Never negative. */
export function remainingFor(t: ActiveTimer, now: number, pomo: PomodoroSettings): number {
  if (typeof t.endsAt === 'number') return Math.max(0, t.endsAt - now)
  if (typeof t.remainingMs === 'number') return Math.max(0, t.remainingMs)
  return modeMs(t.mode, pomo)
}

/** 0 to 1 progress through the current mode. */
export function progressFor(t: ActiveTimer, now: number, pomo: PomodoroSettings): number {
  const total = modeMs(t.mode, pomo)
  return Math.min(1, Math.max(0, 1 - remainingFor(t, now, pomo) / total))
}

export function start(t: ActiveTimer, now: number, pomo: PomodoroSettings): ActiveTimer {
  const left = typeof t.remainingMs === 'number' ? t.remainingMs : modeMs(t.mode, pomo)
  const next: ActiveTimer = { ...t, endsAt: now + left }
  delete next.remainingMs
  return next
}

export function pause(t: ActiveTimer, now: number): ActiveTimer {
  if (typeof t.endsAt !== 'number') return t
  const next: ActiveTimer = { ...t, remainingMs: Math.max(0, t.endsAt - now) }
  delete next.endsAt
  return next
}

/** Back to the full length of the current mode, keeping the task. */
export function reset(t: ActiveTimer): ActiveTimer {
  const next: ActiveTimer = { ...t }
  delete next.endsAt
  delete next.remainingMs
  return next
}

/** Move on to the next mode without running: focus -> short/long break (long after every Nth session), break -> focus. */
export function advance(t: ActiveTimer, pomo: PomodoroSettings): ActiveTimer {
  const base = reset(t)
  if (t.mode === 'focus') return { ...base, mode: t.session >= pomo.longEvery ? 'long' : 'short' }
  return { ...base, mode: 'focus', session: t.mode === 'long' ? 1 : t.session + 1 }
}

/** The clock hour that holds most of a session (the hour of its midpoint). */
export function sessionHour(startMs: number, endMs: number): number {
  return new Date((startMs + endMs) / 2).getHours()
}

/** MM:SS, rounding up so 00:00 only shows when it is really over. */
export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
