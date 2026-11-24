import { useState } from 'react'
import { doc, documentId, getDoc, setDoc, updateDoc, where } from 'firebase/firestore'
import { getISODay, parseISO } from 'date-fns'
import { Bar } from '../components/ui/Bar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useDay } from '../hooks/useDay'
import { useNow } from '../hooks/useNow'
import { useUserDoc } from '../hooks/useUserDoc'
import { CAT_COLORS } from '../lib/defaults'
import { dayKey, isoWeek, isoWeekRange, lastKeys, shiftKey } from '../lib/dates'
import { db } from '../lib/firebase'
import { formatINR, hoursSpent, planEqualsReality, sumAmounts } from '../lib/metrics'
import { toast } from '../lib/toast'
import { safeWrite } from '../lib/write'
import type { Big3Task, DayDoc, Expense, Habit, Parked, WeekDoc } from '../types'

const BUDGET_CATS = ['college', 'placement', 'exploration', 'startup'] as const

function Prompt({ id, label, value, onSave }: { id: string; label: string; value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-[11px] tracking-[0.08em] text-muted">
        {label}
      </label>
      <textarea
        id={id}
        value={text}
        rows={2}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== value && onSave(text)}
        className="rounded-xl bg-ink border-[1.5px] border-line-strong px-3 py-2.5 text-sm text-text resize-y min-h-[56px]"
      />
    </div>
  )
}

export default function Review() {
  const { user } = useAuth()
  const uid = user?.uid
  const { settings } = useUserDoc()
  const now = useNow()
  const today = dayKey(now, settings.dayStartHour)
  const { day, loading, patch } = useDay(today)
  const [openEarly, setOpenEarly] = useState(false)

  const { items: parked } = useCollection<Omit<Parked, 'id'>>('parked')
  const { items: weeks } = useCollection<WeekDoc>('weeks')
  const { items: habits } = useCollection<Omit<Habit, 'id'>>('habits')

  const week = isoWeekRange(today)
  const { items: weekDays } = useCollection<Partial<DayDoc>>(
    'days',
    [where(documentId(), '>=', week.start), where(documentId(), '<=', week.end)],
    week.start,
  )
  const { items: weekExpenses } = useCollection<Omit<Expense, 'id'>>('expenses', [where('date', '>=', week.start)], week.start)

  const weekId = isoWeek(parseISO(today))
  const weekDoc = weeks.find((w) => w.id === weekId)
  const isWeekEnd = getISODay(parseISO(today)) === 7
  const showWeekly = isWeekEnd || openEarly

  const openParked = parked.filter((p) => !p.cleared).sort((a, b) => a.createdAt - b.createdAt)
  const unfinished = day.big3.filter((t) => !t.done)

  const moveToTomorrow = (task: Big3Task) => {
    if (!uid) return
    void safeWrite(async () => {
      const ref = doc(db, 'users', uid, 'days', shiftKey(today, 1))
      const snap = await getDoc(ref)
      const tomorrow = (snap.data() as Partial<DayDoc> | undefined)?.big3 ?? []
      if (tomorrow.length >= 3) {
        toast("tomorrow's big 3 is already full. drop one or keep it here.")
        return
      }
      await setDoc(ref, { big3: [...tomorrow, { ...task, done: false }] }, { merge: true })
      await patch({ big3: day.big3.filter((t) => t.id !== task.id) })
      toast('moved to tomorrow. fresh start.')
    })
  }
  const drop = (task: Big3Task) => void patch({ big3: day.big3.filter((t) => t.id !== task.id) })
  const clearParked = (id: string) => uid && void safeWrite(() => updateDoc(doc(db, 'users', uid, 'parked', id), { cleared: true }))
  const saveJournal = (field: 'win' | 'lesson' | 'tomorrow', v: string) => void patch({ journal: { [field]: v } })
  const saveWeek = (field: keyof WeekDoc, v: string) => uid && void safeWrite(() => setDoc(doc(db, 'users', uid, 'weeks', weekId), { [field]: v }, { merge: true }))

  // weekly numbers
  const sofar = lastKeys(today, 7).filter((k) => k >= week.start)
  const byDate = new Map(weekDays.map((d) => [d.id, d]))
  const days = sofar.map((k) => byDate.get(k) ?? {})
  const pr = planEqualsReality(days)
  const activeHabits = habits.filter((h) => !h.archived)
  const habitPossible = activeHabits.length * sofar.length
  const habitKept = sofar.reduce((sum, k) => sum + activeHabits.filter((h) => byDate.get(k)?.habits?.[h.id]).length, 0)
  const weekSpend = sumAmounts(weekExpenses.filter((e) => e.date <= week.end))
  const weeklyShare = Math.round((settings.monthlyBudget * 7) / 30)

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-display text-[60px] leading-[0.92] font-extrabold tracking-[-0.04em]">
          shut the day <span className="text-lime">down.</span>
        </h1>
        <span className="text-[15px] text-muted">three lines, clear your head, tomorrow starts clean.</span>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</p>
      ) : (
        <div className="grid gap-[22px] items-start [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
          <Card className="flex flex-col gap-4">
            <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">daily shutdown</h2>
            <Prompt id="win" label="ONE WIN" value={day.journal.win} onSave={(v) => saveJournal('win', v)} />
            <Prompt id="lesson" label="ONE LESSON" value={day.journal.lesson} onSave={(v) => saveJournal('lesson', v)} />
            <Prompt id="tomorrow" label="TOMORROW'S FOCUS" value={day.journal.tomorrow} onSave={(v) => saveJournal('tomorrow', v)} />
          </Card>

          <div className="flex flex-col gap-[22px]">
            <Card className="flex flex-col gap-2">
              <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">unfinished big 3</h2>
              {unfinished.length === 0 ? (
                <p className="m-0 text-sm text-muted">{day.big3.length === 0 ? 'no big 3 set today.' : 'all done. that is a clean sheet.'}</p>
              ) : (
                unfinished.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center gap-2 border-t border-[#2E2A36] pt-2">
                    <span className="flex-1 min-w-[140px] text-[15px] font-semibold">{t.title}</span>
                    <Button className="min-h-[40px] px-3 text-[13px] shadow-none" onClick={() => moveToTomorrow(t)}>
                      move to tomorrow
                    </Button>
                    <Button variant="ghost" className="min-h-[40px] px-3 text-[13px]" onClick={() => drop(t)}>
                      drop
                    </Button>
                  </div>
                ))
              )}
              <span className="text-xs text-muted">nothing here is overdue. it just moves.</span>
            </Card>

            <Card className="flex flex-col gap-2">
              <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">parked thoughts</h2>
              {openParked.length === 0 ? (
                <p className="m-0 text-sm text-muted">head is clear. nothing parked.</p>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {openParked.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => clearParked(p.id)}
                      title="tap to clear"
                      className="text-[12.5px] font-medium bg-surface-2 border border-dashed border-[#6E6580] rounded-full px-[11px] py-2 text-text"
                    >
                      {p.text} ✓
                    </button>
                  ))}
                </div>
              )}
              <span className="text-xs text-muted">tap a thought to clear it once it's handled.</span>
            </Card>
          </div>

          <Card className="flex flex-col gap-4 [grid-column:1/-1]">
            <div className="flex justify-between items-baseline gap-2 flex-wrap">
              <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">weekly review · {weekId}</h2>
              {!showWeekly && (
                <Button variant="ghost" onClick={() => setOpenEarly(true)}>
                  open early
                </Button>
              )}
            </div>
            {!showWeekly ? (
              <p className="m-0 text-sm text-muted">your weekly review opens on sunday. a new week is a clean slate.</p>
            ) : (
              <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[44px] font-extrabold tracking-[-0.04em] leading-none text-lime">{pr === null ? '–' : `${Math.round(pr * 100)}%`}</span>
                    <span className="text-sm text-muted">plan = reality</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-muted">TIME BUDGET</span>
                    {BUDGET_CATS.map((c) => {
                      const spent = hoursSpent(days, c)
                      const planned = settings.weeklyBudgetHours[c] ?? 0
                      return (
                        <div key={c} className="grid grid-cols-[96px_minmax(0,1fr)_64px] gap-2.5 items-center">
                          <span className="text-[13px] font-semibold">{c}</span>
                          <Bar value={planned ? spent / planned : 0} color={CAT_COLORS[c]} />
                          <span className="font-mono text-[11.5px] font-semibold text-right">
                            {spent}/{planned}h
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">habits kept</span>
                    <span className="font-bold">
                      {habitKept} of {habitPossible} habit-days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">money this week</span>
                    <span className="font-bold">
                      {formatINR(weekSpend)} <span className="text-muted font-medium">of ~{formatINR(weeklyShare)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3.5">
                  <Prompt id="worked" label="WHAT WORKED" value={weekDoc?.worked ?? ''} onSave={(v) => saveWeek('worked', v)} />
                  <Prompt id="didnt" label="WHAT DIDN'T" value={weekDoc?.didnt ?? ''} onSave={(v) => saveWeek('didnt', v)} />
                  <Prompt id="change" label="ONE CHANGE FOR NEXT WEEK" value={weekDoc?.change ?? ''} onSave={(v) => saveWeek('change', v)} />
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
