import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { playChime } from '../lib/chime'
import { dayKey } from '../lib/dates'
import { advance, formatClock, idleTimer, isRunning, modeMs, pause, remainingFor, reset, sessionHour, start } from '../lib/timer'
import { slotsPatch } from './useDay'
import { safeWrite } from '../lib/write'
import type { ActiveTimer, DayDoc, TimerMode, UserDoc, WorkCat } from '../types'
import { useAuth } from './useAuth'
import { useUserDoc } from './useUserDoc'

const STORAGE_KEY = 'mc.timer'

function readLocal(): ActiveTimer | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ActiveTimer) : undefined
  } catch {
    return undefined
  }
}

function writeLocal(t: ActiveTimer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  } catch {
    /* storage can be blocked; Firestore still has it */
  }
}

interface TimerApi {
  timer: ActiveTimer
  running: boolean
  /** ms left, computed from the clock at the moment of calling. */
  remaining: () => number
  toggle: () => void
  doReset: () => void
  skip: () => void
  setMode: (mode: TimerMode) => void
  setTask: (task: { id?: string; title?: string; cat: WorkCat; ticketId?: string }) => void
  setCat: (cat: WorkCat) => void
}

const TimerContext = createContext<TimerApi | null>(null)

/** A finished focus session: save it and fill the actual slot of the hour it mostly covered, if that slot is empty. */
async function saveFocusSession(uid: string, t: ActiveTimer, endsAt: number, settings: UserDoc) {
  const ms = modeMs('focus', settings.pomodoro)
  const startMs = endsAt - ms
  const cat = t.cat ?? 'other'
  const date = dayKey(new Date(endsAt), settings.dayStartHour)
  await addDoc(collection(db, 'users', uid, 'sessions'), {
    date,
    start: startMs,
    end: endsAt,
    minutes: settings.pomodoro.focus,
    taskTitle: t.taskTitle || 'focus session',
    cat,
    ticketId: t.ticketId,
  })
  const hour = String(sessionHour(startMs, endsAt))
  const dayRef = doc(db, 'users', uid, 'days', date)
  const snap = await getDoc(dayRef)
  const actual = (snap.data() as Partial<DayDoc> | undefined)?.actual ?? {}
  if (!actual[hour]) {
    await setDoc(dayRef, slotsPatch('actual', { [hour]: { cat, label: t.taskTitle } }), { merge: true })
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { settings } = useUserDoc()
  const pomo = settings.pomodoro
  // `local` wins when set (fast, survives refresh offline); otherwise the value saved in Firestore.
  const [local, setLocal] = useState<ActiveTimer | undefined>(readLocal)
  const timer: ActiveTimer = local ?? settings.activeTimer ?? idleTimer()
  const handled = useRef<number | null>(null)
  const uid = user?.uid

  const commit = (next: ActiveTimer) => {
    setLocal(next)
    writeLocal(next)
    if (uid) void safeWrite(() => updateDoc(doc(db, 'users', uid), { activeTimer: next }))
  }

  // Finish the timer when endsAt passes: on time, after a refresh, or after the laptop slept.
  useEffect(() => {
    const endsAt = timer.endsAt
    if (typeof endsAt !== 'number' || !uid) return
    const finish = () => {
      if (Date.now() < endsAt || handled.current === endsAt) return
      handled.current = endsAt
      if (Date.now() - endsAt < 60000) playChime()
      if (timer.mode === 'focus') void safeWrite(() => saveFocusSession(uid, timer, endsAt, settings), "couldn't save that session.")
      commit(advance(timer, pomo))
    }
    const id = setTimeout(finish, Math.max(0, endsAt - Date.now()))
    const onWake = () => finish()
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
    return () => {
      clearTimeout(id)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
    // commit/settings change identity every render; the timer itself is the trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.endsAt, timer.mode, uid])

  // Tab title shows the countdown while running.
  useEffect(() => {
    const endsAt = timer.endsAt
    if (typeof endsAt !== 'number') return
    const original = document.title
    const tick = () => {
      document.title = `${formatClock(endsAt - Date.now())} · ${timer.mode === 'focus' ? 'focus' : 'break'} · mc.`
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => {
      clearInterval(id)
      document.title = original
    }
  }, [timer.endsAt, timer.mode])

  const api: TimerApi = {
    timer,
    running: isRunning(timer),
    remaining: () => remainingFor(timer, Date.now(), pomo),
    toggle: () => commit(isRunning(timer) ? pause(timer, Date.now()) : start(timer, Date.now(), pomo)),
    doReset: () => commit(reset(timer)),
    skip: () => commit(advance(timer, pomo)),
    setMode: (mode) => commit({ ...reset(timer), mode }),
    setTask: (task) => commit({ ...timer, taskId: task.id, taskTitle: task.title, cat: task.cat, ticketId: task.ticketId }),
    setCat: (cat) => commit({ ...timer, cat }),
  }

  return <TimerContext.Provider value={api}>{children}</TimerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimer(): TimerApi {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider')
  return ctx
}
