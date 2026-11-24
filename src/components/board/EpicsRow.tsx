import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Chip } from '../ui/Chip'
import { CAT_COLORS, WORK_CATS } from '../../lib/defaults'
import { epicProgress } from '../../lib/metrics'
import type { Epic, Ticket, WorkCat } from '../../types'

interface Props {
  epics: Epic[]
  tickets: Ticket[]
  onAdd: (epic: Omit<Epic, 'id'>) => void
  onDelete: (epic: Epic) => void
}

export function EpicsRow({ epics, tickets, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [cat, setCat] = useState<WorkCat>('college')
  const [due, setDue] = useState('')

  return (
    <section className="flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">epics</h2>
        <span className="font-mono text-[11px] text-muted">big projects, broken into tickets</span>
      </div>
      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
        {epics.map((e) => {
          const mine = tickets.filter((t) => t.epicId === e.id)
          const done = mine.filter((t) => t.status === 'done').length
          const pct = Math.round(epicProgress(mine) * 100)
          return (
            <div key={e.id} className="bg-surface border-[1.5px] border-line rounded-2xl px-4 py-3.5 flex flex-col gap-2.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[14.5px] font-bold">{e.name}</span>
                <span className="font-mono text-xs font-semibold">{pct}%</span>
              </div>
              <div className="h-2 rounded bg-surface-2 overflow-hidden">
                <div className="h-full rounded" style={{ width: `${pct}%`, background: CAT_COLORS[e.cat] }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-muted">
                  {done} of {mine.length} tickets{e.due ? ` · due ${format(parseISO(e.due), 'dd MMM').toLowerCase()}` : ''}
                </span>
                <button type="button" aria-label={`Delete epic ${e.name}`} onClick={() => onDelete(e)} className="w-9 h-9 -mr-2 bg-transparent border-0 text-muted">
                  ×
                </button>
              </div>
            </div>
          )
        })}
        {adding ? (
          <form
            className="bg-surface border-[1.5px] border-dashed border-line-strong rounded-2xl px-4 py-3.5 flex flex-col gap-2"
            onSubmit={(ev) => {
              ev.preventDefault()
              if (!name.trim()) return
              onAdd({ name: name.trim(), cat, due })
              setName('')
              setDue('')
              setAdding(false)
            }}
          >
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="epic name" aria-label="epic name" className="min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text" />
            <div className="flex flex-wrap gap-1.5">
              {WORK_CATS.map((c) => (
                <Chip key={c} cat={c} selected={cat === c} onClick={() => setCat(c)} aria-pressed={cat === c}>
                  {c}
                </Chip>
              ))}
            </div>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="epic due date" className="min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text" />
            <div className="flex gap-2">
              <button type="submit" className="min-h-[44px] px-4 rounded-btn bg-lime text-ink font-extrabold text-sm border-0">
                add epic
              </button>
              <button type="button" onClick={() => setAdding(false)} className="min-h-[44px] px-4 rounded-btn bg-transparent border-2 border-line-strong text-text font-bold text-sm">
                cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="min-h-[100px] rounded-2xl bg-transparent border-[1.5px] border-dashed border-line-strong text-muted font-semibold text-sm"
          >
            {epics.length === 0 ? '+ add your first epic (a big project)' : '+ new epic'}
          </button>
        )}
      </div>
    </section>
  )
}
