import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useUserDoc } from '../../hooks/useUserDoc'
import { dayKey } from '../../lib/dates'
import { db } from '../../lib/firebase'
import { createTicket } from '../../lib/tickets'
import { toast } from '../../lib/toast'
import { safeWrite } from '../../lib/write'
import type { DayDoc } from '../../types'

type Kind = 'ticket' | 'task' | 'expense' | 'thought'

const TABS: { kind: Kind; label: string; hint: string }[] = [
  { kind: 'ticket', label: 'ticket', hint: 'goes to the backlog' },
  { kind: 'task', label: 'task', hint: 'goes to today’s big 3 if a slot is free' },
  { kind: 'expense', label: 'expense', hint: 'start with the amount, like 120 chai' },
  { kind: 'thought', label: 'thought', hint: 'parks it for the daily review' },
]

/** Ctrl+K (or the capture button) from any page: one input, four destinations. */
export function QuickCapture() {
  const { user } = useAuth()
  const { settings } = useUserDoc()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Kind>('ticket')
  const [text, setText] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('mc:capture', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mc:capture', onOpen)
    }
  }, [])

  const close = () => {
    setOpen(false)
    setText('')
  }

  const submit = async () => {
    const value = text.trim()
    const uid = user?.uid
    if (!value || !uid) return
    const today = dayKey(new Date(), settings.dayStartHour)

    if (kind === 'ticket') {
      const ok = await safeWrite(() =>
        createTicket(uid, { title: value, cat: 'other', points: 2, priority: 'med', status: 'todo', blocked: false, blockedReason: '', subtasks: [] }),
      )
      if (ok) toast('ticket added to the backlog.')
      else return
    } else if (kind === 'task') {
      const ref = doc(db, 'users', uid, 'days', today)
      const ok = await safeWrite(async () => {
        const snap = await getDoc(ref)
        const big3 = (snap.data() as Partial<DayDoc> | undefined)?.big3 ?? []
        if (big3.length >= 3) {
          toast('today’s big 3 is full. finish or drop one first.')
          throw new Error('big3 full')
        }
        await setDoc(ref, { big3: [...big3, { id: crypto.randomUUID(), title: value, cat: 'other', estMin: 30, done: false }] }, { merge: true })
      }, 'today’s big 3 is full. finish or drop one first.')
      if (!ok) return
      toast('added to today’s big 3.')
    } else if (kind === 'expense') {
      const m = value.match(/^₹?\s*(\d[\d,]*)\s*(.*)$/)
      if (!m) {
        toast('start with an amount, like “120 chai”.')
        return
      }
      const amount = parseInt(m[1].replace(/,/g, ''), 10)
      const ok = await safeWrite(() => addDoc(collection(db, 'users', uid, 'expenses'), { date: today, ts: new Date().getTime(), amount, cat: 'other', note: m[2].trim() }))
      if (!ok) return
      toast('expense logged.')
    } else {
      const ok = await safeWrite(() => addDoc(collection(db, 'users', uid, 'parked'), { text: value, createdAt: new Date().getTime(), cleared: false }))
      if (!ok) return
      toast('parked. it will be waiting at shutdown.')
    }
    close()
  }

  return (
    <Modal open={open} onClose={close} title="Quick capture">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div role="tablist" aria-label="Capture type" className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              role="tab"
              aria-selected={kind === t.kind}
              onClick={() => setKind(t.kind)}
              className={`min-h-[40px] px-4 rounded-full text-[13px] font-bold ${kind === t.kind ? 'bg-lime text-ink border-0' : 'bg-transparent text-text-soft border-[1.5px] border-line-strong'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="capture"
          placeholder="type it, press enter"
          className="min-h-[56px] rounded-btn bg-ink border-[1.5px] border-line-strong px-4 text-base text-text"
        />
        <div className="flex justify-between font-mono text-[11px] text-muted">
          <span>{TABS.find((t) => t.kind === kind)?.hint}</span>
          <span>enter to save · esc to close</span>
        </div>
      </form>
    </Modal>
  )
}
