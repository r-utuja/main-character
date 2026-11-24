import { describe, expect, it } from 'vitest'
import { advance, formatClock, idleTimer, pause, progressFor, remainingFor, reset, sessionHour, start } from './timer'

const pomo = { focus: 25, short: 5, long: 15, longEvery: 4, dailyGoal: 8 }
const MIN = 60000

describe('timer', () => {
  it('idle timer shows the full length', () => {
    expect(remainingFor(idleTimer(), 0, pomo)).toBe(25 * MIN)
    expect(remainingFor(idleTimer('long'), 0, pomo)).toBe(15 * MIN)
  })
  it('remaining comes from the clock, not a counter', () => {
    const t = start(idleTimer(), 1000, pomo)
    expect(remainingFor(t, 1000, pomo)).toBe(25 * MIN)
    expect(remainingFor(t, 1000 + 10 * MIN, pomo)).toBe(15 * MIN)
    // laptop sleeps for an hour: the timer is simply over, never negative
    expect(remainingFor(t, 1000 + 60 * MIN, pomo)).toBe(0)
  })
  it('pause freezes and resume continues from the same remaining time', () => {
    const running = start(idleTimer(), 0, pomo)
    const paused = pause(running, 5 * MIN)
    expect(paused.endsAt).toBeUndefined()
    expect(remainingFor(paused, 99 * MIN, pomo)).toBe(20 * MIN)
    const resumed = start(paused, 50 * MIN, pomo)
    expect(resumed.endsAt).toBe(70 * MIN)
    expect(resumed.remainingMs).toBeUndefined()
  })
  it('reset returns to the full length and keeps the task', () => {
    const t = reset(pause(start({ ...idleTimer(), taskId: 'a' }, 0, pomo), MIN))
    expect(t.taskId).toBe('a')
    expect(remainingFor(t, 0, pomo)).toBe(25 * MIN)
  })
  it('progress is clamped between 0 and 1', () => {
    const t = start(idleTimer(), 0, pomo)
    expect(progressFor(t, 0, pomo)).toBe(0)
    expect(progressFor(t, 12.5 * MIN, pomo)).toBeCloseTo(0.5)
    expect(progressFor(t, 999 * MIN, pomo)).toBe(1)
  })
})

describe('advance', () => {
  it('short break after sessions 1-3, long break after the 4th', () => {
    expect(advance(idleTimer('focus', 2), pomo).mode).toBe('short')
    expect(advance(idleTimer('focus', 4), pomo).mode).toBe('long')
  })
  it('respects longEvery from settings', () => {
    expect(advance(idleTimer('focus', 2), { ...pomo, longEvery: 2 }).mode).toBe('long')
  })
  it('break leads to the next session; a long break restarts at 1', () => {
    expect(advance(idleTimer('short', 2), pomo)).toMatchObject({ mode: 'focus', session: 3 })
    expect(advance(idleTimer('long', 4), pomo)).toMatchObject({ mode: 'focus', session: 1 })
  })
})

describe('helpers', () => {
  it('sessionHour is the hour of the midpoint', () => {
    const start = new Date(2026, 10, 24, 10, 50).getTime()
    expect(sessionHour(start, start + 25 * MIN)).toBe(11)
    const s2 = new Date(2026, 10, 24, 10, 5).getTime()
    expect(sessionHour(s2, s2 + 25 * MIN)).toBe(10)
  })
  it('formats MM:SS', () => {
    expect(formatClock(25 * MIN)).toBe('25:00')
    expect(formatClock(1)).toBe('00:01')
    expect(formatClock(-5)).toBe('00:00')
  })
})
