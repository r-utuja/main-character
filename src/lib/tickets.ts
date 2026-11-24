import { collection, deleteField, doc, getDoc, runTransaction, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { shiftKey } from './dates'
import { sprintPoints } from './metrics'
import type { DayDoc, Sprint, Ticket, UserDoc, WorkCat } from '../types'

export const PREFIX: Record<WorkCat, keyof UserDoc['ticketCounters']> = {
  college: 'COL',
  placement: 'PLC',
  exploration: 'EXP',
  startup: 'STR',
  other: 'OTH',
}

export type NewTicket = Omit<Ticket, 'id' | 'key' | 'createdAt'>

/** Create a ticket with the next key for its category (COL-20, PLC-08...). The counter lives on the user doc. */
export async function createTicket(uid: string, data: NewTicket): Promise<string> {
  const userRef = doc(db, 'users', uid)
  const ticketRef = doc(collection(db, 'users', uid, 'tickets'))
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef)
    const counters: Partial<UserDoc['ticketCounters']> = (snap.data() as Partial<UserDoc> | undefined)?.ticketCounters ?? {}
    const prefix = PREFIX[data.cat]
    const n = (counters[prefix] ?? 0) + 1
    tx.set(ticketRef, { ...data, key: `${prefix}-${String(n).padStart(2, '0')}`, createdAt: Date.now() })
    tx.set(userRef, { ticketCounters: { [prefix]: n } }, { merge: true })
  })
  return ticketRef.id
}

export function statusPatch(status: Ticket['status']) {
  return { status, doneAt: status === 'done' ? Date.now() : deleteField() }
}

/** Ticking a ticket done also ticks the big-3 task linked to it today (and un-ticks it). */
export async function syncBig3(uid: string, dayKeyStr: string, ticketId: string, done: boolean) {
  const ref = doc(db, 'users', uid, 'days', dayKeyStr)
  const snap = await getDoc(ref)
  const big3 = (snap.data() as Partial<DayDoc> | undefined)?.big3
  if (!big3?.some((t) => t.ticketId === ticketId && t.done !== done)) return
  await setDoc(ref, { big3: big3.map((t) => (t.ticketId === ticketId ? { ...t, done } : t)) }, { merge: true })
}

export async function moveTicket(uid: string, ticket: Ticket, status: Ticket['status'], today: string) {
  await updateDoc(doc(db, 'users', uid, 'tickets', ticket.id), statusPatch(status))
  if ((status === 'done') !== (ticket.status === 'done')) await syncBig3(uid, today, ticket.id, status === 'done')
}

/** Close the active sprint (recording completed points), open the next one and carry unfinished tickets over. */
export async function startNextSprint(
  uid: string,
  active: Sprint | undefined,
  allSprints: Sprint[],
  tickets: Ticket[],
  today: string,
  lengthDays: number,
) {
  const batch = writeBatch(db)
  const newRef = doc(collection(db, 'users', uid, 'sprints'))
  const number = allSprints.reduce((m, s) => Math.max(m, s.number), 0) + 1
  if (active) {
    const mine = tickets.filter((t) => t.sprintId === active.id)
    batch.update(doc(db, 'users', uid, 'sprints', active.id), { status: 'closed', completedPoints: sprintPoints(mine).done })
    for (const t of mine) if (t.status !== 'done') batch.update(doc(db, 'users', uid, 'tickets', t.id), { sprintId: newRef.id })
  }
  batch.set(newRef, { number, start: today, end: shiftKey(today, Math.max(1, lengthDays) - 1), goal: '', status: 'active' })
  await batch.commit()
}
