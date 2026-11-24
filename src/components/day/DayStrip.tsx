import type { CSSProperties } from 'react'
import { CAT_COLORS } from '../../lib/defaults'
import { hourLabel, hourOrder } from '../../lib/dates'
import type { DayDoc, Slot } from '../../types'
import { Legend } from './Legend'

interface Props {
  day: DayDoc
  dayStartHour: number
  now: Date
  onCellClick: (kind: 'plan' | 'actual', hour: number) => void
}

const CELL = 'flex-1 h-[30px] rounded-[5px] box-border overflow-hidden p-0 border-0'
const OUTLINE: CSSProperties = { outline: '2px solid #CDF56A', outlineOffset: 1 }

/** "your 24 hours": PLAN and ACTUAL rows of 24 cells for today. */
export function DayStrip({ day, dayStartHour, now, onCellClick }: Props) {
  const order = hourOrder(dayStartHour)
  const nowHour = now.getHours()
  const nowPos = order.indexOf(nowHour)

  const planCell = (h: number) => {
    const s: Slot | undefined = day.plan[String(h)]
    const style: CSSProperties = s
      ? { background: CAT_COLORS[s.cat], opacity: s.cat === 'sleep' ? 1 : 0.5 }
      : { border: '1.5px dashed #3B3546' }
    return (
      <button
        key={h}
        type="button"
        aria-label={`plan ${hourLabel(h)}:00${s ? ` ${s.cat}` : ' empty'}`}
        onClick={() => onCellClick('plan', h)}
        className={CELL}
        style={{ ...style, ...(h === nowHour ? OUTLINE : null) }}
      />
    )
  }

  const actualCell = (h: number, i: number) => {
    const s: Slot | undefined = day.actual[String(h)]
    const isNow = h === nowHour
    const label = `actual ${hourLabel(h)}:00${s ? ` ${s.cat}` : ' empty'}`
    const common = { type: 'button' as const, 'aria-label': label, onClick: () => onCellClick('actual', h) }
    if (!s) {
      const past = i < nowPos
      return (
        <button
          key={h}
          {...common}
          className={CELL}
          style={{ border: '1.5px dashed #3B3546', background: 'transparent', ...(isNow ? OUTLINE : null), opacity: past ? 0.8 : 1 }}
        />
      )
    }
    if (s.cat === 'leak') {
      return (
        <button key={h} {...common} className={`${CELL} mc-leak`} style={{ border: '1.5px solid #FFA36C', ...(isNow ? OUTLINE : null) }} />
      )
    }
    if (isNow) {
      const pct = Math.round((now.getMinutes() / 60) * 100) || 2
      return (
        <button key={h} {...common} className={CELL} style={{ background: '#2A2631', ...OUTLINE }}>
          <div className="h-full" style={{ width: `${pct}%`, background: CAT_COLORS[s.cat] }} />
        </button>
      )
    }
    return <button key={h} {...common} className={CELL} style={{ background: CAT_COLORS[s.cat] }} />
  }

  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-2.5">
      <div className="flex flex-wrap justify-between items-center gap-2.5">
        <h2 className="m-0 font-display text-[20px] font-extrabold tracking-[-0.02em]">your 24 hours</h2>
        <Legend />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px] grid grid-cols-[56px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 items-center">
          <span className="font-mono text-[11px] text-muted">PLAN</span>
          <div className="flex gap-[3px]">{order.map(planCell)}</div>
          <span className="font-mono text-[11px] text-muted">ACTUAL</span>
          <div className="flex gap-[3px]">{order.map(actualCell)}</div>
          <span />
          <div className="flex gap-[3px]">
            {order.map((h) => (
              <span
                key={h}
                className={`flex-1 text-center font-mono text-[10px] ${h === nowHour ? 'text-lime font-semibold' : 'text-muted'}`}
              >
                {hourLabel(h)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
