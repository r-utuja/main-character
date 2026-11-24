import { useEffect, useState } from 'react'
import { deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { safeWrite } from '../lib/write'
import type { DayDoc, Slot } from '../types'
import { useAuth } from './useAuth'

export function emptyDay(): DayDoc {
  return {
    plan: {},
    actual: {},
    big3: [],
    mvd: false,
    mvdDone: [false, false, false],
    habits: {},
    journal: { win: '', lesson: '', tomorrow: '' },
  }
}

/** Live document for one day. A missing document is simply an empty day. */
export function useDay(date: string) {
  const { user } = useAuth()
  const uid = user?.uid
  const [state, setState] = useState<{ date: string; stored: Partial<DayDoc> | null } | null>(null)

  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      doc(db, 'users', uid, 'days', date),
      (snap) => {
        setState({ date, stored: snap.exists() ? (snap.data() as Partial<DayDoc>) : null })
      },
      (err) => {
        console.error(err)
        setState({ date, stored: null })
      },
    )
  }, [uid, date])

  const ready = state?.date === date
  const loading = !ready
  const day: DayDoc = { ...emptyDay(), ...(ready ? state.stored : null) }

  /** Merge any fields into the day doc (nested maps merge, arrays are replaced). */
  const patch = (data: Record<string, unknown>) => {
    if (!uid) return Promise.resolve(false)
    return safeWrite(() => setDoc(doc(db, 'users', uid, 'days', date), data, { merge: true }))
  }

  /** Set (or with null, clear) several slots of plan/actual at once. Keys are clock hours. */
  const setSlots = (kind: 'plan' | 'actual', entries: Record<string, Slot | null>) => patch(slotsPatch(kind, entries))

  return { day, loading, patch, setSlots }
}

/** Write to any day (used to fill an actual slot or plan tomorrow without a live listener). */
export function writeDay(uid: string, date: string, data: Record<string, unknown>) {
  return safeWrite(() => setDoc(doc(db, 'users', uid, 'days', date), data, { merge: true }))
}

/** Firestore merge payload that sets/clears slots. Keys are clock hours; null clears. */
export function slotsPatch(kind: 'plan' | 'actual', entries: Record<string, Slot | null>) {
  const value: Record<string, Slot | ReturnType<typeof deleteField>> = {}
  for (const [hour, slot] of Object.entries(entries)) value[hour] = slot ?? deleteField()
  return { [kind]: value }
}
