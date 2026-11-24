import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDoc, collection, doc, updateDoc, where } from 'firebase/firestore'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useDay } from '../hooks/useDay'
import { useNow } from '../hooks/useNow'
import { useTimer } from '../hooks/useTimer'
import { useUserDoc } from '../hooks/useUserDoc'
import { CAT_COLORS, WORK_CATS } from '../lib/defaults'
import { dayKey, formatTime } from '../lib/dates'
import { db } from '../lib/firebase'
import { formatClock, modeMs } from '../lib/timer'
import { safeWrite } from '../lib/write'
import type { Parked, Session, TimerMode } from '../types'

const MODES: { mode: TimerMode; label: (m: number) => string }[] = [
  { mode: 'focus', label: (m) => `focus · ${m}` },
  { mode: 'short', label: (m) => `break · ${m}` },
  { mode: 'long', label: (m) => `long break · ${m}` },
]

export default function Focus() {
  const { user } = useAuth()
  const { settings } = useUserDoc()
  const pomo = settings.pomodoro
  const { timer, running, toggle, doReset, skip, setMode, setTask, setCat } = useTimer()
  const now = useNow(running ? 1000 : 60000)
  const today = dayKey(now, settings.dayStartHour)
  const { day } = useDay(today)
  const { items: sessions } = useCollection<Session>('sessions', [where('date', '==', today)], today)
  const { items: parked } = useCollection<Parked>('parked')
  const [params] = useSearchParams()
  const [park, setPark] = useState('')

  // /focus?task=<id> preselects that task
  const wantedId = params.get('task')
  const wanted = wantedId ? day.big3.find((t) => t.id === wantedId) : undefined
  useEffect(() => {
    if (wanted && timer.taskId !== wanted.id && !running) {
      setTask({ id: wanted.id, title: wanted.title, cat: wanted.cat, ticketId: wanted.ticketId })
    }
    // run once the wanted task is known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted?.id])

  // Space toggles start/pause when no input is focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.tagName === 'BUTTON' || el.isContentEditable)
      if (e.code === 'Space' && !typing) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const remaining = running && typeof timer.endsAt === 'number' ? Math.max(0, timer.endsAt - now.getTime()) : timer.remainingMs ?? modeMs(timer.mode, pomo)
  const total = modeMs(timer.mode, pomo)
  const pct = Math.round(Math.min(1, Math.max(0, 1 - remaining / total)) * 100)
  const paused = !running && typeof timer.remainingMs === 'number'

  const sticker = running ? (timer.mode === 'focus' ? 'LOCKED IN' : 'ON BREAK') : 'READY'
  const mins = Math.ceil(remaining / 60000)
  let status: string
  if (timer.mode === 'focus') {
    status = running ? `locked in. ${mins} min to go, you’ve got this.` : paused ? 'paused. pick it back up when you’re ready.' : 'ready when you are. hit start and don’t look back.'
  } else {
    status = timer.mode === 'short' ? 'short break. stand up, water, stretch. no scrolling.' : 'long break. you earned this one.'
  }

  const doneCount = sessions.length
  const doneMin = sessions.reduce((s, x) => s + x.minutes, 0)
  const goal = Math.max(1, pomo.dailyGoal)
  const log = [...sessions].sort((a, b) => a.start - b.start)
  const openParked = parked.filter((p) => !p.cleared).sort((a, b) => a.createdAt - b.createdAt)
  const cat = timer.cat ?? 'other'

  const addPark = () => {
    const text = park.trim()
    if (!text || !user) return
    setPark('')
    void safeWrite(() => addDoc(collection(db, 'users', user.uid, 'parked'), { text, createdAt: Date.now(), cleared: false }))
  }
  const clearPark = (id: string) => {
    if (user) void safeWrite(() => updateDoc(doc(db, 'users', user.uid, 'parked', id), { cleared: true }))
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-xs tracking-[0.06em] text-muted">
          {format(now, 'EEE d MMM yyyy').toUpperCase()} · {formatTime(now)}
        </span>
        <Link
          to="/settings"
          className="min-h-[44px] flex items-center gap-2.5 px-3.5 rounded-btn bg-surface border-[1.5px] border-line text-text text-[13px] font-semibold no-underline hover:text-text"
        >
          <span className="font-mono text-xs">
            {pomo.focus} / {pomo.short} / {pomo.long}
          </span>
          <span className="text-muted">long break every {pomo.longEvery}</span>
          <span className="text-lime font-bold">edit</span>
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-display text-[60px] leading-[0.92] font-extrabold tracking-[-0.04em]">
          the focus <span className="text-lime">room.</span>
        </h1>
        <span className="text-[15px] text-muted">one task. one timer. phone face down.</span>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section className="relative flex-[3_1_520px] min-w-0 bg-surface border-2 border-lime rounded-[28px] px-8 pt-[34px] pb-[30px] mt-2.5 shadow-[8px_8px_0_#CDF56A] flex flex-col gap-[22px]">
          <span
            className={`absolute -top-3.5 left-6 font-mono text-xs font-semibold tracking-[0.1em] px-3 py-[7px] rounded-lg -rotate-3 ${
              running ? 'bg-lime text-ink' : 'bg-ink text-lime border-[1.5px] border-lime'
            }`}
          >
            {sticker}
          </span>

          <div role="group" aria-label="Timer mode" className="grid grid-cols-3 gap-2 max-w-[460px]">
            {MODES.map((m) => {
              const on = timer.mode === m.mode
              return (
                <button
                  key={m.mode}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMode(m.mode)}
                  className={`min-h-[44px] rounded-xl text-[13.5px] font-bold ${on ? 'bg-text text-ink border-0' : 'bg-transparent text-muted border-[1.5px] border-line'}`}
                >
                  {m.label(m.mode === 'focus' ? pomo.focus : m.mode === 'short' ? pomo.short : pomo.long)}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <span
              role="timer"
              className="font-display font-extrabold leading-[0.82] tracking-[-0.06em] [font-variant-numeric:tabular-nums] text-[clamp(96px,15vw,200px)]"
            >
              {formatClock(remaining)}
            </span>
            <div className="flex flex-col items-end gap-2.5 pb-2.5">
              <div className="flex gap-2" role="img" aria-label={`Session ${timer.session} of ${pomo.longEvery}`}>
                {Array.from({ length: pomo.longEvery }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className="w-4 h-4 rounded-[4px] rotate-45"
                    style={{ background: n < timer.session ? '#CDF56A' : n === timer.session ? '#B8A6FF' : '#3B3546' }}
                  />
                ))}
              </div>
              <span className="font-mono text-xs text-muted">
                session {timer.session} of {pomo.longEvery}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-3.5 rounded-[7px] bg-surface-2 overflow-hidden">
              <div className="h-full rounded-[7px]" style={{ width: `${pct}%`, background: timer.mode === 'focus' ? '#CDF56A' : '#86CBFF' }} />
            </div>
            <span className="text-sm text-text-soft">{status}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.08em] text-muted">WORKING ON</span>
            {day.big3.length === 0 ? (
              <p className="m-0 text-sm text-muted">
                no big 3 yet. add them on the <Link to="/">dashboard</Link>, or just start and log it under a category below.
              </p>
            ) : (
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr))]">
                {day.big3.map((t) => {
                  const on = timer.taskId === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTask({ id: t.id, title: t.title, cat: t.cat, ticketId: t.ticketId })}
                      className={`min-h-[72px] text-left flex flex-col items-start justify-between gap-2 px-3.5 py-3 rounded-[14px] text-text ${
                        on ? 'bg-surface-2 border-2 border-lime' : 'bg-[#17151C] border-[1.5px] border-line'
                      }`}
                    >
                      <span className={`text-[14.5px] font-bold ${t.done ? 'line-through text-muted' : ''}`}>{t.title}</span>
                      <span className="text-[11px] font-bold text-ink px-2 py-[3px] rounded-full" style={{ background: CAT_COLORS[t.cat] }}>
                        {t.cat}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.08em] text-muted mr-1">LOGS AS</span>
            {WORK_CATS.map((c) => {
              const on = cat === c
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCat(c)}
                  className={`min-h-[36px] px-[13px] rounded-full text-[12.5px] font-bold ${on ? 'text-ink' : 'bg-transparent text-text-soft border-[1.5px] border-line-strong'}`}
                  style={on ? { background: CAT_COLORS[c], border: `1.5px solid ${CAT_COLORS[c]}` } : undefined}
                >
                  {c}
                </button>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={toggle}
              className="flex-1 max-w-[360px] min-h-[60px] rounded-[18px] bg-lime border-0 text-ink font-extrabold text-lg shadow-[5px_5px_0_#B8A6FF]"
            >
              {running ? 'pause' : paused ? 'resume' : 'start'}
            </button>
            <button
              type="button"
              onClick={doReset}
              aria-label="Reset timer"
              className="w-[60px] h-[60px] rounded-[18px] bg-transparent border-2 border-line-strong text-text flex items-center justify-center"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={skip}
              aria-label="Skip to next"
              className="w-[60px] h-[60px] rounded-[18px] bg-transparent border-2 border-line-strong text-text flex items-center justify-center"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 5l9 7-9 7zM18 5v14" />
              </svg>
            </button>
          </div>
        </section>

        <div className="flex-[2_1_340px] min-w-0 flex flex-col gap-[22px]">
          <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-3">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">TODAY</span>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-[52px] font-extrabold tracking-[-0.04em] leading-none text-lime">{doneCount}</span>
              <span className="font-display text-xl font-bold text-muted">
                pomodoros · {Math.floor(doneMin / 60)}h {String(doneMin % 60).padStart(2, '0')}m
              </span>
            </div>
            <div className="flex gap-[5px]" role="img" aria-label={`${doneCount} of ${goal} pomodoros done today`}>
              {Array.from({ length: goal }, (_, i) => (
                <span key={i} className="flex-1 h-3 rounded-[3px]" style={{ background: i < doneCount ? '#CDF56A' : '#2A2631' }} />
              ))}
            </div>
            <span className="text-[12.5px] text-muted">daily goal: {goal}. halfway gets you the streak.</span>
          </section>

          <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-1">
            <h2 className="m-0 mb-2 font-display text-[22px] font-extrabold tracking-[-0.02em]">session log</h2>
            {log.length === 0 ? (
              <p className="m-0 text-sm text-muted border-t border-[#2E2A36] pt-3">no sessions yet. the first one is the hardest.</p>
            ) : (
              log.map((l) => (
                <div key={l.id} className="grid grid-cols-[96px_10px_minmax(0,1fr)] gap-2.5 items-center min-h-[42px] border-t border-[#2E2A36]">
                  <span className="font-mono text-[11.5px] text-muted">
                    {formatTime(new Date(l.start))} – {formatTime(new Date(l.end))}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[l.cat] }} />
                  <span className="text-[13.5px] font-semibold">{l.taskTitle}</span>
                </div>
              ))
            )}
            <span className="text-xs text-muted mt-1.5">every session lands in your hour tracker automatically.</span>
          </section>

          <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-3">
            <label htmlFor="park" className="font-display text-xl font-extrabold tracking-[-0.01em]">
              brain popped a thought? park it.
            </label>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addPark()
              }}
            >
              <input
                id="park"
                type="text"
                value={park}
                onChange={(e) => setPark(e.target.value)}
                placeholder="deal with it after this session…"
                className="flex-1 min-w-0 min-h-[46px] bg-ink border-[1.5px] border-line-strong rounded-xl px-3 text-text text-sm"
              />
              <button type="submit" aria-label="Park thought" className="w-[46px] h-[46px] shrink-0 rounded-xl bg-college border-0 flex items-center justify-center">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#121016" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
            <div className="flex gap-1.5 flex-wrap">
              {openParked.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title="tap to clear"
                  onClick={() => clearPark(p.id)}
                  className="text-[12.5px] font-medium bg-surface-2 border border-dashed border-[#6E6580] rounded-full px-[11px] py-1.5 text-text"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
