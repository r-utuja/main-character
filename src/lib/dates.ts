import { format, subHours } from 'date-fns'

/** Local YYYY-MM-DD for the "day" a moment belongs to, given the day-start hour. */
export function dayKey(date: Date = new Date(), dayStartHour = 0): string {
  return format(subHours(date, dayStartHour), 'yyyy-MM-dd')
}

/** ISO week id like 2026-W48. */
export function isoWeek(date: Date = new Date()): string {
  return format(date, "RRRR-'W'II")
}

/** 24h clock, always. */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

/** "13h 01m" style countdown. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}
