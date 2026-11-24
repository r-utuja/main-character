import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc, where } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useNow } from '../hooks/useNow'
import { useUserDoc } from '../hooks/useUserDoc'
import { MONEY_CATS, MONEY_COLORS } from '../lib/defaults'
import { dayKey, formatTime, isoWeekRange, shiftKey } from '../lib/dates'
import { db } from '../lib/firebase'
import { budgetVerdict, categoryTotals, daysLeftInMonth, formatINR, monthGone, safeToSpend, spendNudge, sumAmounts } from '../lib/metrics'
import { safeWrite } from '../lib/write'
import type { Expense } from '../types'

const colorOf = (cat: string) => MONEY_COLORS[cat] ?? '#8F87A0'

function Sticker({ value, label, bg, rotate }: { value: string; label: string; bg: string; rotate: number }) {
  return (
    <div className="rounded-2xl px-4 py-3 flex flex-col gap-0.5 text-ink" style={{ background: bg, transform: `rotate(${rotate}deg)` }}>
      <span className="font-display text-[32px] font-extrabold tracking-[-0.03em] leading-none">{value}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  )
}

function CatButtons({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MONEY_CATS.map((c) => {
        const on = value === c
        return (
          <button
            key={c}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(c)}
            className={`min-h-[38px] px-[13px] rounded-full text-[12.5px] font-bold ${on ? 'text-ink' : 'bg-transparent text-text-soft border-[1.5px] border-line-strong'}`}
            style={on ? { background: colorOf(c), border: `1.5px solid ${colorOf(c)}` } : undefined}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

export default function Money() {
  const { user } = useAuth()
  const uid = user?.uid
  const { settings } = useUserDoc()
  const now = useNow()
  const today = dayKey(now, settings.dayStartHour)
  const yesterday = shiftKey(today, -1)
  const monthStart = `${today.slice(0, 8)}01`
  const week = isoWeekRange(today)
  const from = [monthStart, week.start, yesterday].sort()[0]

  const { items: expenses, loading } = useCollection<Omit<Expense, 'id'>>('expenses', [where('date', '>=', from)], from)

  const [amount, setAmount] = useState('')
  const [pickedCat, setPickedCat] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState<Expense | null>(null)

  const sorted = [...expenses].sort((a, b) => b.ts - a.ts)
  const cat = pickedCat ?? sorted[0]?.cat ?? MONEY_CATS[0]

  const month = expenses.filter((e) => e.date >= monthStart && e.date <= today)
  const todayList = sorted.filter((e) => e.date === today)
  const yesterdayList = sorted.filter((e) => e.date === yesterday)
  const spentToday = sumAmounts(todayList)
  const spentWeek = sumAmounts(expenses.filter((e) => e.date >= week.start && e.date <= today))
  const spentMonth = sumAmounts(month)
  const left = daysLeftInMonth(today)
  const gone = monthGone(today)
  const budget = settings.monthlyBudget
  const used = budget > 0 ? (spentMonth / budget) * 100 : 0
  const totals = categoryTotals(month)
  const nudge = spendNudge(totals)
  const byCat = MONEY_CATS.map((c) => ({ cat: c, amount: totals[c] ?? 0 })).sort((a, b) => b.amount - a.amount)
  const maxCat = Math.max(1, ...byCat.map((c) => c.amount))
  const stackBase = Math.max(budget, spentMonth, 1)
  const verdict = budgetVerdict(spentMonth, budget, gone)

  const add = () => {
    const n = parseInt(amount, 10)
    if (!n || !uid) return
    const entry = { date: today, ts: new Date().getTime(), amount: n, cat, note: note.trim() }
    setAmount('')
    setNote('')
    void safeWrite(() => addDoc(collection(db, 'users', uid, 'expenses'), entry))
  }

  const row = (e: Expense) => (
    <button
      key={e.id}
      type="button"
      onClick={() => setEditing(e)}
      className="grid grid-cols-[46px_10px_minmax(0,1fr)_auto] gap-2.5 items-center min-h-[44px] w-full text-left bg-transparent border-0 border-b border-[#2E2A36] p-0 text-text"
    >
      <span className="font-mono text-xs text-muted">{formatTime(new Date(e.ts))}</span>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorOf(e.cat) }} />
      <div className="flex flex-col gap-px min-w-0">
        <span className="text-sm font-semibold truncate">{e.note || e.cat}</span>
        <span className="text-[11.5px] text-muted">{e.cat}</span>
      </div>
      <span className="font-display text-[17px] font-bold">{formatINR(e.amount)}</span>
    </button>
  )

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs tracking-[0.06em] text-muted">
            {format(parseISO(today), 'MMMM yyyy').toUpperCase()} · {left} DAY{left === 1 ? '' : 'S'} LEFT
          </span>
          <h1 className="m-0 font-display text-[60px] leading-[0.92] font-extrabold tracking-[-0.04em]">
            where&apos;s the
            <br />
            <span className="text-startup">money</span> going?
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Sticker value={formatINR(spentToday)} label="today" bg="#FFA36C" rotate={-2} />
          <Sticker value={formatINR(spentWeek)} label="this week" bg="#B8A6FF" rotate={1.5} />
          <Sticker value={budget > 0 ? formatINR(safeToSpend(budget, spentMonth, left)) : '–'} label="safe to spend / day" bg="#CDF56A" rotate={-1} />
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</p>
      ) : (
        <>
          <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-2.5">
            <div className="flex flex-wrap justify-between items-baseline gap-2">
              <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">MONTHLY BUDGET</span>
              <span className="font-display text-xl font-bold">
                {formatINR(spentMonth)} <span className="text-muted">of {formatINR(budget)}</span>
              </span>
            </div>
            <div className="relative h-4 rounded-md bg-surface-2 overflow-hidden flex">
              {byCat
                .filter((c) => c.amount > 0)
                .map((c) => (
                  <div key={c.cat} title={`${c.cat} ${formatINR(c.amount)}`} className="h-full" style={{ background: colorOf(c.cat), width: `${(c.amount / stackBase) * 100}%` }} />
                ))}
            </div>
            <div className="flex justify-between text-[12.5px] text-muted">
              <span>
                {budget > 0 ? `${used.toFixed(1)}% used · ${Math.round(gone * 100)}% of the month gone` : 'no budget set yet. add one in settings.'}
              </span>
              <span className={`font-bold ${verdict === 'on track' ? 'text-lime' : 'text-startup'}`}>{verdict}</span>
            </div>
          </section>

          <div className="grid gap-[22px] items-start [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
            <section className="relative bg-surface border-2 border-startup rounded-card px-5 pt-[26px] pb-5 mt-2.5 shadow-[5px_5px_0_#FFA36C] flex flex-col gap-3.5">
              <span className="absolute -top-[13px] left-[18px] bg-startup text-ink font-mono text-[11px] font-semibold tracking-[0.08em] px-[11px] py-1.5 rounded-lg -rotate-3">QUICK ADD</span>
              <form
                className="flex flex-col gap-3.5"
                onSubmit={(e) => {
                  e.preventDefault()
                  add()
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="amt" className="text-[12.5px] font-semibold text-muted">
                    amount
                  </label>
                  <div className="flex items-center gap-2 bg-ink border-[1.5px] border-line-strong rounded-btn px-3.5 min-h-[60px]">
                    <span className="font-display text-[30px] font-extrabold text-muted">₹</span>
                    <input
                      id="amt"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1 min-w-0 bg-transparent border-0 outline-none text-text font-display text-[32px] font-extrabold"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[12.5px] font-semibold text-muted">category</span>
                  <CatButtons value={cat} onPick={setPickedCat} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="note" className="text-[12.5px] font-semibold text-muted">
                    note (optional)
                  </label>
                  <input
                    id="note"
                    type="text"
                    placeholder="what was it?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[46px] bg-ink border-[1.5px] border-line-strong rounded-xl px-3 text-text text-sm"
                  />
                </div>
                <Button type="submit" disabled={!amount} className="min-h-[50px] text-[15px]">
                  add it
                </Button>
              </form>
            </section>

            <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-3.5">
              <div className="flex justify-between items-baseline">
                <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">by category</h2>
                <span className="font-mono text-[11px] text-muted">this month</span>
              </div>
              {byCat.map((c) => (
                <div key={c.cat} className="grid grid-cols-[112px_minmax(0,1fr)_64px] gap-3 items-center">
                  <span className="text-[13.5px] font-semibold">{c.cat}</span>
                  <div className="h-3 rounded bg-surface-2 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(c.amount / maxCat) * 100}%`, background: colorOf(c.cat) }} />
                  </div>
                  <span className="font-mono text-xs font-semibold text-right">{formatINR(c.amount)}</span>
                </div>
              ))}
              {nudge && (
                <div className="flex flex-col gap-1 border-[1.5px] border-dashed border-college rounded-[14px] px-3.5 py-3 mt-1">
                  <span className="text-sm font-bold">
                    {nudge.cat} is {Math.round(nudge.pct)}% of this month.
                  </span>
                  <span className="text-[12.5px] leading-[1.4] text-muted">no judgement. want to try 2 no-spend days before the month ends?</span>
                </div>
              )}
            </section>

            <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-1.5">
              <h2 className="m-0 mb-1.5 font-display text-[22px] font-extrabold tracking-[-0.02em]">recent</h2>
              <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">TODAY</span>
              {todayList.length === 0 ? <p className="m-0 py-2 text-sm text-muted">nothing yet today. nice and quiet.</p> : todayList.map(row)}
              <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted mt-2.5">YESTERDAY</span>
              {yesterdayList.length === 0 ? <p className="m-0 py-2 text-sm text-muted">nothing logged.</p> : yesterdayList.map(row)}
            </section>
          </div>
        </>
      )}

      {editing && (
        <EditExpense
          key={editing.id}
          expense={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            if (uid) void safeWrite(() => updateDoc(doc(db, 'users', uid, 'expenses', editing.id), patch))
            setEditing(null)
          }}
          onDelete={() => {
            if (uid) void safeWrite(() => deleteDoc(doc(db, 'users', uid, 'expenses', editing.id)))
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function EditExpense({
  expense,
  onClose,
  onSave,
  onDelete,
}: {
  expense: Expense
  onClose: () => void
  onSave: (patch: { amount: number; cat: string; note: string }) => void
  onDelete: () => void
}) {
  const [amount, setAmount] = useState(String(expense.amount))
  const [cat, setCat] = useState(expense.cat)
  const [note, setNote] = useState(expense.note)
  const [sure, setSure] = useState(false)
  const n = parseInt(amount, 10)

  return (
    <Modal open onClose={onClose} title="Edit expense">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (n) onSave({ amount: n, cat, note: note.trim() })
        }}
      >
        <h2 className="m-0 font-display text-[22px] font-extrabold">edit entry</h2>
        <div className="flex items-center gap-2 bg-ink border-[1.5px] border-line-strong rounded-btn px-3.5 min-h-[56px]">
          <span className="font-display text-[26px] font-extrabold text-muted">₹</span>
          <input
            aria-label="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-text font-display text-[28px] font-extrabold"
          />
        </div>
        <CatButtons value={cat} onPick={setCat} />
        <input
          aria-label="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="note"
          className="min-h-[46px] bg-ink border-[1.5px] border-line-strong rounded-xl px-3 text-text text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!n}>
            save
          </Button>
          <Button variant="ghost" onClick={onClose}>
            cancel
          </Button>
          <Button variant="ghost" className="ml-auto" onClick={() => (sure ? onDelete() : setSure(true))}>
            {sure ? 'really delete?' : 'delete'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
