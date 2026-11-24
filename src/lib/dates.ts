import { addDays, format, getISODay, parseISO, subHours } from 'date-fns'

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

/** Midnight (local) of a YYYY-MM-DD key. */
export function keyToDate(key: string): Date {
  return parseISO(key)
}

/** Move a YYYY-MM-DD key by n days. */
export function shiftKey(key: string, n: number): string {
  return format(addDays(parseISO(key), n), 'yyyy-MM-dd')
}

/** n keys ending at endKey (oldest first). */
export function lastKeys(endKey: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftKey(endKey, i - (n - 1)))
}

/** Monday and Sunday keys of the ISO week containing key. */
export function isoWeekRange(key: string): { start: string; end: string } {
  const offset = getISODay(parseISO(key)) - 1
  const start = shiftKey(key, -offset)
  return { start, end: shiftKey(start, 6) }
}

/** The 24 clock hours in the order a day shows them, starting at the day-start hour. */
export function hourOrder(dayStartHour = 0): number[] {
  return Array.from({ length: 24 }, (_, i) => (i + dayStartHour) % 24)
}

export function hourLabel(h: number): string {
  return String(h).padStart(2, '0')
}

/** Moment the day with this key ends (start of next day). */
export function dayEndsAt(key: string, dayStartHour = 0): Date {
  const start = parseISO(key)
  start.setHours(dayStartHour, 0, 0, 0)
  return new Date(start.getTime() + 24 * 3600000)
}

/** "TUE 24" style label. */
export function shortDayLabel(key: string): string {
  return format(parseISO(key), 'EEE d').toUpperCase()
}
