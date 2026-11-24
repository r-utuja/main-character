import { useState, type ReactNode } from 'react'
import { addDoc, collection, doc, getDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { HabitIcon } from '../components/dashboard/Rituals'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useUserDoc } from '../hooks/useUserDoc'
import { CAT_COLORS } from '../lib/defaults'
import { db } from '../lib/firebase'
import { toast } from '../lib/toast'
import { safeWrite } from '../lib/write'
import type { Habit } from '../types'

const input = 'min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text'
const HABIT_ICONS = ['move', 'breathe', 'piano', 'language', 'read', 'dot']
const HABIT_COLORS = ['#CDF56A', '#B8A6FF', '#FF8FB8', '#86CBFF', '#FFA36C', '#D9D3E2']
const EXPORT_COLLECTIONS = ['days', 'habits', 'tickets', 'sprints', 'epics', 'sessions', 'expenses', 'parked', 'weeks']

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

/** Numeric field that saves when you leave it. Out-of-range values snap back. */
function NumberField({ value, min, max, step = 1, onCommit, width = 'w-28' }: { value: number; min: number; max: number; step?: number; onCommit: (n: number) => void; width?: string }) {
  const [text, setText] = useState(String(value))
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    setText(String(value))
  }
  const commit = () => {
    const n = Number(text)
    if (!Number.isFinite(n) || n < min || n > max) {
      setText(String(value))
      return
    }
    if (n !== value) onCommit(n)
  }
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className={`${input} ${width} font-mono`}
    />
  )
}

function TextField({ value, onCommit, placeholder }: { value: string; onCommit: (s: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    setText(value)
  }
  return (
    <input
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text.trim() && text !== value && onCommit(text.trim())}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className={`${input} w-full`}
    />
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">{title}</h2>
      {children}
    </Card>
  )
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const uid = user?.uid
  const { settings } = useUserDoc()
  const { items: habits } = useCollection<Omit<Habit, 'id'>>('habits')
  const sorted = [...habits].sort((a, b) => a.order - b.order)
  const [newHabit, setNewHabit] = useState('')

  const save = (data: Record<string, unknown>) => {
    if (uid) void safeWrite(() => updateDoc(doc(db, 'users', uid), data))
  }
  const saveHabit = (id: string, data: Partial<Habit>) => {
    if (uid) void safeWrite(() => updateDoc(doc(db, 'users', uid, 'habits', id), data))
  }
  const addHabit = () => {
    const name = newHabit.trim()
    if (!name || !uid) return
    setNewHabit('')
    const order = sorted.reduce((m, h) => Math.max(m, h.order), -1) + 1
    void safeWrite(() => addDoc(collection(db, 'users', uid, 'habits'), { name, icon: 'dot', color: HABIT_COLORS[order % HABIT_COLORS.length], tiny: '1 minute', order, archived: false }))
  }
  const move = (index: number, dir: -1 | 1) => {
    const a = sorted[index]
    const b = sorted[index + dir]
    if (!a || !b || !uid) return
    void safeWrite(async () => {
      const batch = writeBatch(db)
      batch.update(doc(db, 'users', uid, 'habits', a.id), { order: b.order })
      batch.update(doc(db, 'users', uid, 'habits', b.id), { order: a.order })
      await batch.commit()
    })
  }

  const exportJson = async () => {
    if (!uid) return
    try {
      const out: Record<string, unknown> = {}
      const userSnap = await getDoc(doc(db, 'users', uid))
      out.user = userSnap.data() ?? null
      for (const name of EXPORT_COLLECTIONS) {
        const snap = await getDocs(collection(db, 'users', uid, name))
        out[name] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `main-character-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast("couldn't export right now. check your connection?")
    }
  }

  const pomo = settings.pomodoro
  const savePomo = (key: keyof typeof pomo, n: number) => save({ [`pomodoro.${key}`]: n })

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-display text-[60px] leading-[0.92] font-extrabold tracking-[-0.04em]">
          make it <span className="text-lime">yours.</span>
        </h1>
        <span className="text-[15px] text-muted">every change saves as you go.</span>
      </div>

      <div className="grid gap-[22px] items-start [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
        <div className="flex flex-col gap-[22px]">
          <Section title="your day">
            <Field label="day starts at" hint="24h clock, always. the day runs 24 hours from here.">
              <select value={settings.dayStartHour} onChange={(e) => save({ dayStartHour: Number(e.target.value) })} className={`${input} w-28 font-mono`}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </Field>
            <Field label="reality factor" hint="how much longer things take than you think. 1.4 is typical.">
              <NumberField value={settings.realityFactor} min={1} max={3} step={0.1} onCommit={(n) => save({ realityFactor: n })} />
            </Field>
          </Section>

          <Section title="pomodoro">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="focus (min)">
                <NumberField value={pomo.focus} min={1} max={180} onCommit={(n) => savePomo('focus', n)} width="w-full" />
              </Field>
              <Field label="short break">
                <NumberField value={pomo.short} min={1} max={60} onCommit={(n) => savePomo('short', n)} width="w-full" />
              </Field>
              <Field label="long break">
                <NumberField value={pomo.long} min={1} max={90} onCommit={(n) => savePomo('long', n)} width="w-full" />
              </Field>
              <Field label="long break every">
                <NumberField value={pomo.longEvery} min={2} max={8} onCommit={(n) => savePomo('longEvery', n)} width="w-full" />
              </Field>
              <Field label="daily goal">
                <NumberField value={pomo.dailyGoal} min={1} max={20} onCommit={(n) => savePomo('dailyGoal', n)} width="w-full" />
              </Field>
            </div>
          </Section>

          <Section title="sprints">
            <div className="grid grid-cols-2 gap-3">
              <Field label="sprint length (days)" hint="applies to the next sprint you start.">
                <NumberField value={settings.sprintLengthDays} min={1} max={60} onCommit={(n) => save({ sprintLengthDays: n })} width="w-full" />
              </Field>
              <Field label="WIP limit" hint="max tickets in progress.">
                <NumberField value={settings.wipLimit} min={1} max={10} onCommit={(n) => save({ wipLimit: n })} width="w-full" />
              </Field>
            </div>
          </Section>

          <Section title="budgets">
            <Field label="monthly money budget (₹)">
              <NumberField value={settings.monthlyBudget} min={0} max={10000000} step={100} onCommit={(n) => save({ monthlyBudget: n })} width="w-40" />
            </Field>
            <span className="font-mono text-[11px] tracking-[0.08em] text-muted">WEEKLY HOURS PER CATEGORY</span>
            <div className="grid grid-cols-2 gap-3">
              {(['college', 'placement', 'exploration', 'startup'] as const).map((c) => (
                <Field key={c} label={c}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[c] }} />
                    <NumberField value={settings.weeklyBudgetHours[c] ?? 0} min={0} max={100} onCommit={(n) => save({ [`weeklyBudgetHours.${c}`]: n })} width="w-full" />
                  </div>
                </Field>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-[22px]">
          <Section title="habits">
            {sorted.length === 0 && <p className="m-0 text-sm text-muted">no habits yet. add one below.</p>}
            {sorted.map((h, i) => (
              <div key={h.id} className={`flex flex-col gap-2.5 border-t border-[#2E2A36] pt-3 ${h.archived ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-ink shrink-0" style={{ background: h.color }}>
                    <HabitIcon icon={h.icon} />
                  </span>
                  <TextField value={h.name} onCommit={(name) => saveHabit(h.id, { name })} />
                  <button type="button" aria-label={`Move ${h.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className="w-11 h-11 bg-transparent border-0 text-text disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" aria-label={`Move ${h.name} down`} disabled={i === sorted.length - 1} onClick={() => move(i, 1)} className="w-11 h-11 bg-transparent border-0 text-text disabled:opacity-30">
                    ↓
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HABIT_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      aria-label={`icon ${ic}`}
                      aria-pressed={h.icon === ic}
                      onClick={() => saveHabit(h.id, { icon: ic })}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-text ${h.icon === ic ? 'bg-surface-2 border-2 border-lime' : 'bg-transparent border-[1.5px] border-line'}`}
                    >
                      <HabitIcon icon={ic} />
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`colour ${c}`}
                      aria-pressed={h.color === c}
                      onClick={() => saveHabit(h.id, { color: c })}
                      className="w-11 h-11 bg-transparent border-0 p-0 flex items-center justify-center"
                    >
                      <span className="w-7 h-7 rounded-full" style={{ background: c, outline: h.color === c ? '2px solid #F3EFE7' : 'none', outlineOffset: 2 }} />
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <Field label="tiny version (for minimum viable days)">
                    <TextField value={h.tiny} onCommit={(tiny) => saveHabit(h.id, { tiny })} />
                  </Field>
                  <Button variant="ghost" className="shrink-0" onClick={() => saveHabit(h.id, { archived: !h.archived })}>
                    {h.archived ? 'restore' : 'archive'}
                  </Button>
                </div>
              </div>
            ))}
            <form
              className="flex gap-2 border-t border-[#2E2A36] pt-3"
              onSubmit={(e) => {
                e.preventDefault()
                addHabit()
              }}
            >
              <input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="new habit, e.g. stretch" aria-label="new habit" className={`${input} flex-1 min-w-0`} />
              <Button type="submit" disabled={!newHabit.trim()}>
                add
              </Button>
            </form>
          </Section>

          <Section title="minimum viable day">
            <span className="text-sm text-muted">the 3 tiny wins shown when you switch to a minimum viable day.</span>
            {settings.mvdTasks.map((t, i) => (
              <Field key={i} label={`tiny win ${i + 1}`}>
                <TextField
                  value={t}
                  onCommit={(text) => {
                    const next = [...settings.mvdTasks]
                    next[i] = text
                    save({ mvdTasks: next })
                  }}
                />
              </Field>
            ))}
          </Section>

          <Section title="your data">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => void exportJson()}>
                export all data (JSON)
              </Button>
              <Button variant="ghost" onClick={() => void signOut()}>
                sign out
              </Button>
            </div>
            <span className="text-xs text-muted">signed in as {user?.email}</span>
          </Section>
        </div>
      </div>
    </>
  )
}
