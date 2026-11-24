import { useState, type CSSProperties } from 'react'
import { doc, getDoc, where, documentId } from 'firebase/firestore'
import { format, getISODay, parseISO } from 'date-fns'
import { Legend } from '../components/day/Legend'
import { SlotEditor } from '../components/day/SlotEditor'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { slotsPatch, writeDay } from '../hooks/useDay'
import { useNow } from '../hooks/useNow'
import { useUserDoc } from '../hooks/useUserDoc'
import { CAT_COLORS } from '../lib/defaults'
import { dayKey, hourLabel, hourOrder, isoWeekRange, lastKeys, shiftKey, shortDayLabel } from '../lib/dates'
import { db } from '../lib/firebase'
import {
  behindCategory,
  focusedHours,
  hoursSpent,
  leakPattern,
  leakedHours,
  mostBehind,
  peakWindowStart,
  planEqualsReality,
} from '../lib/metrics'
import { toast } from '../lib/toast'
import type { DayDoc, DayRow, Session, Slot, WorkCat } from '../types'

type Range = 'day' | 'week'

interface Editing {
  date: string
  kind: 'plan' | 'actual'
  hour: number
}

const BUDGET_CATS: WorkCat[] = ['college', 'placement', 'exploration', 'startup']

function Sticker({ value, label, bg, rotate, leak = false }: { value: string; label: string; bg?: string; rotate: number; leak?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 flex flex-col gap-0.5 text-ink ${leak ? 'mc-leak border-[1.5px] border-startup' : ''}`}
      style={{ background: leak ? undefined : bg, transform: `rotate(${rotate}deg)` }}
    >
      <span className={`font-display text-[32px] font-extrabold tracking-[-0.03em] leading-none ${leak ? 'text-startup' : ''}`}>{value}</span>
      <span className={`text-xs font-semibold ${leak ? 'text-text' : ''}`}>{label}</span>
    </div>
  )
}

function slotStyle(s: Slot | undefined, kind: 'plan' | 'actual'): { className: string; style: CSSProperties } {
  if (!s) return { className: 'border-[1.5px] border-dashed border-line', style: {} }
  if (s.cat === 'leak') return { className: 'mc-leak border-[1.5px] border-startup', style: {} }
  if (kind === 'plan' && s.cat !== 'sleep') return { className: 'border-2 border-dashed', style: { borderColor: CAT_COLORS[s.cat] } }
  return { className: '', style: { background: CAT_COLORS[s.cat] } }
}

export default function Track() {
  const { user } = useAuth()
  const { settings } = useUserDoc()
  const now = useNow()
  const start = settings.dayStartHour
  const today = dayKey(now, start)
  const nowHour = now.getHours()

  const [range, setRange] = useState<Range>('week')
  const [endKey, setEndKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(`mc.pattern.${today}`) === '1'
    } catch {
      return false
    }
  })

  const end = endKey && endKey <= today ? endKey : today
  const viewKeys = range === 'day' ? [end] : lastKeys(end, 7)
  const fetchFrom = [shiftKey(today, -13), shiftKey(end, -6)].sort()[0]

  const { items: allDays, loading } = useCollection<Partial<DayDoc>>(
    'days',
    [where(documentId(), '>=', fetchFrom), where(documentId(), '<=', today)],
    fetchFrom + today,
  )
  const { items: allSessions } = useCollection<Session>('sessions', [where('date', '>=', fetchFrom)], fetchFrom)

  const byDate = new Map<string, DayRow>(allDays.map((d) => [d.id, d]))
  const dayOf = (key: string): DayRow => byDate.get(key) ?? { id: key }
  const viewDays = viewKeys.map(dayOf)
  const viewSessions = allSessions.filter((s) => viewKeys.includes(s.date))
  const recentKeys = lastKeys(today, 14)
  const recentSessions = allSessions.filter((s) => recentKeys.includes(s.date))

  // stickers
  const pr = planEqualsReality(viewDays)
  const peak = peakWindowStart(recentSessions)
  const focus = focusedHours(viewSessions)

  // time budget (this ISO week)
  const week = isoWeekRange(today)
  const weekDays = lastKeys(today, 7).filter((k) => k >= week.start).map(dayOf)
  const spent: Record<string, number> = {}
  for (const c of [...BUDGET_CATS, 'other' as WorkCat]) spent[c] = hoursSpent(weekDays, c)
  const budget = settings.weeklyBudgetHours
  const daysLeft = 7 - getISODay(parseISO(today))
  const behind = mostBehind(spent, budget)

  // pattern card
  const leakDays = lastKeys(today, 7).map(dayOf)
  const leakRule = leakPattern(leakDays)
  const behindRule = behindCategory(spent, budget, daysLeft)

  const onSave = (e: Editing, entries: Record<string, Slot | null>) => {
    if (user) void writeDay(user.uid, e.date, slotsPatch(e.kind, entries))
  }

  const tryTomorrow = async () => {
    if (!user) return
    const tomorrow = shiftKey(today, 1)
    try {
      const snap = await getDoc(doc(db, 'users', user.uid, 'days', tomorrow))
      const plan = (snap.data() as Partial<DayDoc> | undefined)?.plan ?? {}
      if (leakRule) {
        await writeDay(user.uid, tomorrow, slotsPatch('plan', { [String(leakRule.hour)]: { cat: 'other', label: 'walk + easiest task' } }))
      } else if (behindRule) {
        const hour = [20, 21, 19, 22, 18, 23, 17].find((h) => !plan[String(h)]) ?? 20
        await writeDay(user.uid, tomorrow, slotsPatch('plan', { [String(hour)]: { cat: behindRule.cat, label: `${behindRule.cat} catch-up` } }))
      }
      toast('added to tomorrow’s plan.')
      dismiss()
    } catch (err) {
      console.error(err)
      toast("couldn't plan tomorrow. try again?")
    }
  }
  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(`mc.pattern.${today}`, '1')
    } catch {
      /* storage can be blocked; the card just comes back on refresh */
    }
  }

  const pattern = dismissed
    ? null
    : leakRule
      ? {
          title: `the ${hourLabel(leakRule.hour)}:00 slump got you ${leakRule.days} days this week.`,
          body: `${peak !== null ? `your focus peaks ${hourLabel(peak)}:00 – ${hourLabel((peak + 3) % 24)}:00. ` : ''}give ${hourLabel(leakRule.hour)}:00 a walk + the easiest task.`,
        }
      : behindRule
        ? {
            title: `${behindRule.cat} is running behind this week.`,
            body: `${Math.round(behindRule.shortBy * 10) / 10}h short with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. give it a block tomorrow evening.`,
          }
        : null

  const order = hourOrder(start)
  const rangeLabel =
    range === 'day'
      ? `${shortDayLabel(end)} ${format(parseISO(end), 'MMM yyyy').toUpperCase()}`
      : `LAST 7 DAYS · ${format(parseISO(viewKeys[0]), 'd')} – ${format(parseISO(end), 'd MMM').toUpperCase()}`
  const step = range === 'day' ? 1 : 7
  const editingDay = editing ? dayOf(editing.date) : null

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-0.5">
          <button type="button" aria-label="Earlier" onClick={() => setEndKey(shiftKey(end, -step))} className="w-11 h-11 -ml-3 bg-transparent border-0 text-text">
            ‹
          </button>
          <span className="font-mono text-xs tracking-[0.06em] text-muted">{rangeLabel}</span>
          <button
            type="button"
            aria-label="Later"
            disabled={end >= today}
            onClick={() => setEndKey(shiftKey(end, step) > today ? today : shiftKey(end, step))}
            className="w-11 h-11 bg-transparent border-0 text-text disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <Segmented
          label="Range"
          value={range}
          onChange={setRange}
          options={[
            { value: 'day', label: 'day' },
            { value: 'week', label: 'week' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="m-0 font-display text-[60px] leading-[0.92] font-extrabold tracking-[-0.04em]">
          where did the hours
          <br />
          <span className="text-lime">actually</span> go?
        </h1>
        <div className="flex flex-wrap gap-3">
          <Sticker value={pr === null ? '–' : `${Math.round(pr * 100)}%`} label="plan = reality" bg="#CDF56A" rotate={-2} />
          <Sticker value={`${Math.round(focus * 10) / 10}h`} label="focused work" bg="#B8A6FF" rotate={1.5} />
          <Sticker value={`${leakedHours(viewDays)}h`} label="leaked" rotate={-1} leak />
          <Sticker value={peak === null ? '–' : `${hourLabel(peak)}–${hourLabel((peak + 3) % 24)}`} label="your peak hours" bg="#86CBFF" rotate={2} />
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</p>
      ) : range === 'week' ? (
        <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-3">
          <div className="flex flex-wrap justify-between items-center gap-2.5">
            <h2 className="m-0 font-display text-[20px] font-extrabold tracking-[-0.02em]">every hour, last 7 days</h2>
            <Legend />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[760px] flex flex-col gap-1">
              {viewKeys.map((key) => {
                const d = dayOf(key)
                const isToday = key === today
                return (
                  <div key={key} className="grid grid-cols-[76px_minmax(0,1fr)] gap-2.5 items-center">
                    <span className={`font-mono text-[11.5px] font-semibold ${isToday ? 'text-lime' : 'text-muted'}`}>{shortDayLabel(key)}</span>
                    <div className="flex gap-[3px]">
                      {order.map((h) => {
                        const s = d.actual?.[String(h)]
                        const st = slotStyle(s, 'actual')
                        const isNow = isToday && h === nowHour
                        return (
                          <button
                            key={h}
                            type="button"
                            aria-label={`${key} ${hourLabel(h)}:00 ${s ? s.cat : 'empty'}`}
                            onClick={() => setEditing({ date: key, kind: 'actual', hour: h })}
                            className={`flex-1 h-[26px] rounded box-border p-0 ${st.className}`}
                            style={{ ...st.style, ...(isNow ? { outline: '2px solid #CDF56A', outlineOffset: 1 } : null) }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2.5 mt-0.5">
                <span />
                <div className="flex gap-[3px]">
                  {order.map((h) => (
                    <span key={h} className="flex-1 text-center font-mono text-[10px] text-muted">
                      {hourLabel(h)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-center gap-2.5">
            <h2 className="m-0 font-display text-[20px] font-extrabold tracking-[-0.02em]">hour by hour</h2>
            <Legend />
          </div>
          <div className="grid grid-cols-[44px_minmax(0,1fr)_28px_minmax(0,1fr)] gap-x-2.5 gap-y-1 items-center">
            <span />
            <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">PLANNED</span>
            <span className="font-mono text-[10.5px] text-muted text-center">=/≠</span>
            <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">ACTUAL</span>
            {order.map((h) => {
              const d = dayOf(end)
              const p = d.plan?.[String(h)]
              const a = d.actual?.[String(h)]
              const ps = slotStyle(p, 'plan')
              const as = slotStyle(a, 'actual')
              const differs = p && a && p.cat !== a.cat
              const same = p && a && p.cat === a.cat
              const isNow = end === today && h === nowHour
              return (
                <div key={h} className="contents">
                  <span className={`font-mono text-[11.5px] font-semibold ${isNow ? 'text-lime' : 'text-muted'}`}>{hourLabel(h)}:00</span>
                  <button
                    type="button"
                    aria-label={`plan ${hourLabel(h)}:00 ${p ? p.cat : 'empty'}`}
                    onClick={() => setEditing({ date: end, kind: 'plan', hour: h })}
                    className={`h-9 rounded-lg px-2.5 text-left text-xs font-semibold text-text-soft truncate ${ps.className}`}
                    style={ps.style}
                  >
                    {p ? <span className={p.cat === 'sleep' || p.cat === 'leak' ? '' : 'text-text'}>{p.label || p.cat}</span> : null}
                  </button>
                  <span className={`text-center font-bold ${differs ? 'text-startup' : 'text-muted'}`} aria-label={differs ? 'differs' : same ? 'same' : ''}>
                    {differs ? '≠' : same ? '=' : ''}
                  </span>
                  <button
                    type="button"
                    aria-label={`actual ${hourLabel(h)}:00 ${a ? a.cat : 'empty'}`}
                    onClick={() => setEditing({ date: end, kind: 'actual', hour: h })}
                    className={`h-9 rounded-lg px-2.5 text-left text-xs font-bold truncate ${as.className} ${a && a.cat !== 'leak' && a.cat !== 'sleep' ? 'text-ink' : 'text-text-soft'}`}
                    style={as.style}
                  >
                    {a ? a.label || a.cat : null}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid gap-[22px] items-start [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
        <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-4">
          <div className="flex justify-between items-baseline">
            <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">time budget</h2>
            <span className="font-mono text-[11px] text-muted">spent / planned this week</span>
          </div>
          {[...BUDGET_CATS, 'other' as WorkCat].map((c) => {
            const planned = c === 'other' ? 0 : budget[c as keyof typeof budget] ?? 0
            const pct = planned ? Math.min(100, Math.round((spent[c] / planned) * 100)) : 100
            return (
              <div key={c} className="grid grid-cols-[104px_minmax(0,1fr)_76px] gap-3 items-center">
                <span className="text-sm font-bold">{c}</span>
                <div className="h-3.5 rounded bg-surface-2 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: CAT_COLORS[c], opacity: planned ? 1 : 0.6 }} />
                </div>
                <span className="font-mono text-xs font-semibold text-right">{planned ? `${spent[c]} / ${planned}h` : `${spent[c]}h`}</span>
              </div>
            )
          })}
          <span className="text-[12.5px] leading-[1.4] text-muted">
            {behind
              ? `${behind.cat} is the most behind: ${Math.round(behind.shortBy * 10) / 10}h short with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left in the week.`
              : 'everything is on pace. no judgement either way.'}
          </span>
        </section>

        {pattern && (
          <section className="relative bg-surface border-2 border-lime rounded-card px-5 pt-7 pb-5 mt-2.5 flex flex-col gap-2.5 shadow-[5px_5px_0_#CDF56A]">
            <span className="absolute -top-[13px] left-[18px] bg-lime text-ink font-mono text-[11px] font-semibold tracking-[0.08em] px-[11px] py-1.5 rounded-lg -rotate-3">
              PATTERN SPOTTED
            </span>
            <h2 className="m-0 font-display text-[26px] leading-[1.05] font-extrabold tracking-[-0.02em]">{pattern.title}</h2>
            <p className="m-0 text-[14.5px] leading-[1.45] text-text-soft">{pattern.body}</p>
            <div className="flex gap-2.5 mt-1">
              <Button onClick={() => void tryTomorrow()} className="shadow-none">
                try it tomorrow
              </Button>
              <Button variant="ghost" onClick={dismiss}>
                not now
              </Button>
            </div>
          </section>
        )}
      </div>

      {editing && editingDay && (
        <SlotEditor
          kind={editing.kind}
          hour={editing.hour}
          current={editingDay[editing.kind]?.[String(editing.hour)]}
          dayStartHour={start}
          onSave={(entries) => onSave(editing, entries)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
