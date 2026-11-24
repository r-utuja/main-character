import { CAT_COLORS } from '../../lib/defaults'
import { priorityRank } from '../../lib/metrics'
import type { Ticket } from '../../types'
import { formatDue, PriorityIcon } from './TicketCard'

interface Props {
  tickets: Ticket[] // tickets not in the current sprint
  hasSprint: boolean
  onOpen: (t: Ticket) => void
  onAddToSprint: (t: Ticket) => void
}

export function BacklogTab({ tickets, hasSprint, onOpen, onAddToSprint }: Props) {
  const sorted = [...tickets].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.createdAt - b.createdAt)
  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col">
      <div className="flex justify-between items-baseline mb-2">
        <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">backlog</h2>
        <span className="font-mono text-[11px] text-muted">{sorted.length} tickets · sorted by priority</span>
      </div>
      {sorted.length === 0 && <p className="m-0 py-3 text-sm text-muted border-t border-[#2E2A36]">nothing waiting. new tickets from quick capture land here.</p>}
      {sorted.map((t) => (
        <div key={t.id} className="grid grid-cols-[72px_18px_minmax(0,1fr)_auto_auto_auto] gap-3 items-center min-h-[56px] border-t border-[#2E2A36]">
          <span className="font-mono text-[11.5px] font-semibold text-muted">{t.key}</span>
          <PriorityIcon priority={t.priority} />
          <button type="button" onClick={() => onOpen(t)} className="text-left bg-transparent border-0 p-0 min-h-[44px] text-[14.5px] font-semibold text-text truncate">
            {t.title}
          </button>
          <span className="hidden sm:inline text-[11px] font-bold text-ink px-2 py-[3px] rounded-full" style={{ background: CAT_COLORS[t.cat] }}>
            {t.cat}
          </span>
          <span className="font-mono text-[11px] text-muted">
            {t.points} pts{t.due ? ` · ${formatDue(t.due)}` : ''}
          </span>
          <button
            type="button"
            disabled={!hasSprint}
            onClick={() => onAddToSprint(t)}
            title={hasSprint ? '' : 'start a sprint first'}
            className="min-h-[44px] px-3 rounded-btn bg-transparent border-2 border-line-strong text-text text-[12.5px] font-bold disabled:opacity-40"
          >
            add to sprint
          </button>
        </div>
      ))}
    </section>
  )
}
