import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import type { SprintPoints } from '../../lib/metrics'
import type { Sprint, Ticket } from '../../types'

interface Props {
  sprint: Sprint | undefined
  day: number
  length: number
  points: SprintPoints
  tickets: Ticket[] // tickets of this sprint
  wipLimit: number
}

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0)

const card = 'flex flex-col gap-3 bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] no-underline text-text hover:text-text'

export function SprintSnapshot({ sprint, day, length, points, tickets, wipLimit }: Props) {
  if (!sprint) {
    return (
      <Link to="/board" className={card}>
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">NO SPRINT RUNNING</span>
        <span className="font-display text-xl font-bold">a clean slate.</span>
        <span className="text-[12.5px] font-bold text-lime">start one on the board →</span>
      </Link>
    )
  }
  const inProgress = tickets.filter((t) => t.status === 'progress').length
  const full = inProgress >= wipLimit
  const blocked = tickets.find((t) => t.blocked && t.status !== 'done')
  const dueNext = tickets
    .filter((t) => t.due && t.status !== 'done')
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))[0]

  return (
    <Link to="/board" className={card}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">
          SPRINT {sprint.number} · DAY {day} OF {length}
        </span>
        <span className="text-[12.5px] font-bold text-lime">open board →</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[44px] font-extrabold tracking-[-0.04em] leading-none text-lime">{points.done}</span>
        <span className="font-display text-xl font-bold text-muted">/ {points.committed} pts done</span>
      </div>
      <div className="flex h-2.5 rounded-[5px] overflow-hidden bg-surface-2 gap-0.5">
        <div style={{ width: `${pct(points.done, points.committed)}%`, background: '#CDF56A' }} />
        <div style={{ width: `${pct(points.review, points.committed)}%`, background: '#B8A6FF' }} />
        <div style={{ width: `${pct(points.progress, points.committed)}%`, background: '#6E6580' }} />
      </div>
      <div className="flex flex-col gap-[7px] text-[13px]">
        <div className="flex justify-between gap-2.5">
          <span className="text-muted">in progress</span>
          <span className={`font-bold ${full ? 'text-startup' : ''}`}>
            {inProgress}/{wipLimit}
            {full ? ' · WIP full' : ''}
          </span>
        </div>
        <div className="flex justify-between gap-2.5">
          <span className="text-muted">blocked</span>
          <span className="font-bold text-right">{blocked ? `${blocked.key} ${blocked.title}` : 'nothing'}</span>
        </div>
        <div className="flex justify-between gap-2.5">
          <span className="text-muted">due next</span>
          <span className="font-bold text-right">{dueNext?.due ? `${dueNext.title} · ${format(parseISO(dueNext.due), 'dd MMM').toLowerCase()}` : 'nothing due'}</span>
        </div>
      </div>
    </Link>
  )
}
