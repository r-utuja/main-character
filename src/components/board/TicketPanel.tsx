/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { deleteField } from 'firebase/firestore'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { WORK_CATS } from '../../lib/defaults'
import type { Epic, Priority, Subtask, Ticket, TicketStatus, WorkCat } from '../../types'

export interface TicketDraft {
  title: string
  cat: WorkCat
  points: number
  priority: Priority
  status: TicketStatus
  epicId: string
  due: string
  blocked: boolean
  blockedReason: string
  subtasks: Subtask[]
}

export function draftOf(t?: Ticket): TicketDraft {
  return {
    title: t?.title ?? '',
    cat: t?.cat ?? 'college',
    points: t?.points ?? 2,
    priority: t?.priority ?? 'med',
    status: t?.status ?? 'todo',
    epicId: t?.epicId ?? '',
    due: t?.due ?? '',
    blocked: t?.blocked ?? false,
    blockedReason: t?.blockedReason ?? '',
    subtasks: t?.subtasks ?? [],
  }
}

/** Fields to write for an existing ticket (empty optional fields are removed). */
export function updatePatch(d: TicketDraft) {
  return {
    title: d.title.trim(),
    cat: d.cat,
    points: d.points,
    priority: d.priority,
    epicId: d.epicId || deleteField(),
    due: d.due || deleteField(),
    blocked: d.blocked,
    blockedReason: d.blocked ? d.blockedReason.trim() : '',
    subtasks: d.subtasks,
  }
}

const POINTS = [1, 2, 3, 5, 8]
const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'todo', label: 'to do' },
  { value: 'progress', label: 'in progress' },
  { value: 'review', label: 'in review' },
  { value: 'done', label: 'done' },
]
const PRIOS: Priority[] = ['high', 'med', 'low']

const input = 'min-h-[44px] w-full rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text'
const label = 'font-mono text-[10.5px] tracking-[0.08em] text-muted'

interface Props {
  ticket?: Ticket
  epics: Epic[]
  onSave: (draft: TicketDraft) => void
  onDelete?: () => void
  onClose: () => void
}

export function TicketPanel({ ticket, epics, onSave, onDelete, onClose }: Props) {
  const [d, setD] = useState<TicketDraft>(() => draftOf(ticket))
  const [sub, setSub] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof TicketDraft>(k: K, v: TicketDraft[K]) => setD((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        aria-label="Ticket details"
        className="w-full max-w-[440px] h-full overflow-y-auto bg-surface border-l-[1.5px] border-line p-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (d.title.trim()) onSave(d)
        }}
      >
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-muted">{ticket ? ticket.key : 'NEW TICKET'}</span>
          <button type="button" aria-label="Close" onClick={onClose} className="w-11 h-11 bg-transparent border-0 text-text text-xl">
            ×
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={label}>TITLE</span>
          <input autoFocus value={d.title} onChange={(e) => set('title', e.target.value)} className={input} placeholder="what needs doing?" />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={label}>CATEGORY</span>
          <div className="flex flex-wrap gap-1.5">
            {WORK_CATS.map((c) => (
              <Chip key={c} cat={c} selected={d.cat === c} onClick={() => set('cat', c)} aria-pressed={d.cat === c}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>STORY POINTS</span>
          <div className="flex gap-1.5">
            {POINTS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={d.points === p}
                onClick={() => set('points', p)}
                className={`w-11 h-11 rounded-xl font-mono text-sm font-semibold ${d.points === p ? 'bg-text text-ink border-0' : 'bg-transparent text-text-soft border-[1.5px] border-line-strong'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>PRIORITY</span>
          <div className="flex gap-1.5">
            {PRIOS.map((p) => (
              <Chip key={p} selected={d.priority === p} onClick={() => set('priority', p)} aria-pressed={d.priority === p}>
                {p === 'med' ? 'medium' : p}
              </Chip>
            ))}
          </div>
        </div>

        {ticket && (
          <label className="flex flex-col gap-1.5">
            <span className={label}>STATUS</span>
            <select value={d.status} onChange={(e) => set('status', e.target.value as TicketStatus)} className={input}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={label}>EPIC</span>
            <select value={d.epicId} onChange={(e) => set('epicId', e.target.value)} className={input}>
              <option value="">none</option>
              {epics.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>DUE</span>
            <input type="date" value={d.due} onChange={(e) => set('due', e.target.value)} className={input} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 text-sm font-semibold min-h-[44px]">
            <input type="checkbox" checked={d.blocked} onChange={(e) => set('blocked', e.target.checked)} className="w-5 h-5 accent-[#CDF56A]" />
            blocked
          </label>
          {d.blocked && <input value={d.blockedReason} onChange={(e) => set('blockedReason', e.target.value)} placeholder="waiting on…" className={input} />}
        </div>

        <div className="flex flex-col gap-2">
          <span className={label}>SUBTASKS</span>
          {d.subtasks.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={s.done}
                aria-label={s.text}
                onChange={(e) => set('subtasks', d.subtasks.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
                className="w-5 h-5 accent-[#CDF56A]"
              />
              <span className={`flex-1 text-sm ${s.done ? 'line-through text-muted' : ''}`}>{s.text}</span>
              <button type="button" aria-label={`Remove ${s.text}`} onClick={() => set('subtasks', d.subtasks.filter((_, j) => j !== i))} className="w-9 h-9 bg-transparent border-0 text-muted">
                ×
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (sub.trim()) {
                    set('subtasks', [...d.subtasks, { text: sub.trim(), done: false }])
                    setSub('')
                  }
                }
              }}
              placeholder="add a subtask, press enter"
              className={input}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Button type="submit" disabled={!d.title.trim()}>
            {ticket ? 'save' : 'add ticket'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            cancel
          </Button>
          {ticket && onDelete && (
            <Button variant="ghost" className="ml-auto" onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}>
              {confirmDelete ? 'really delete?' : 'delete'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
