/* eslint-disable react-refresh/only-export-components */
import { useDraggable } from '@dnd-kit/core'
import { format, parseISO } from 'date-fns'
import { CAT_COLORS } from '../../lib/defaults'
import type { Priority, Ticket } from '../../types'

const PRIO_LABEL: Record<Priority, string> = { high: 'High priority', med: 'Medium priority', low: 'Low priority' }

export function PriorityIcon({ priority }: { priority: Priority }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
  return (
    <span role="img" aria-label={PRIO_LABEL[priority]} className="flex">
      {priority === 'high' && (
        <svg {...p} stroke="#FFA36C">
          <path d="M6 14l6-6 6 6M6 19l6-6 6 6" />
        </svg>
      )}
      {priority === 'med' && (
        <svg {...p} stroke="#86CBFF">
          <path d="M6 10h12M6 15h12" />
        </svg>
      )}
      {priority === 'low' && (
        <svg {...p} stroke="#8F87A0">
          <path d="M6 10l6 6 6-6" />
        </svg>
      )}
    </span>
  )
}

export function formatDue(due?: string): string {
  return due ? format(parseISO(due), 'd MMM').toLowerCase() : ''
}

interface Props {
  ticket: Ticket
  onOpen: (t: Ticket) => void
}

/** Draggable ticket card. A drag of 6px or more starts a move; a plain click opens the panel. */
export function TicketCard({ ticket: t, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id })
  const done = t.status === 'done'
  const subDone = t.subtasks.filter((s) => s.done).length

  return (
    <article
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(t)}
      className="bg-surface border-[1.5px] border-line rounded-[14px] px-3.5 py-3 flex flex-col gap-2.5 cursor-grab touch-none"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 30 : undefined,
        boxShadow: isDragging ? '4px 4px 0 #B8A6FF' : undefined,
      }}
    >
      <div className="flex justify-between items-center">
        <span className={`font-mono text-[11.5px] font-semibold ${done ? 'text-other' : 'text-muted'}`}>{t.key}</span>
        <PriorityIcon priority={t.priority} />
      </div>
      <span className={`text-[14.5px] font-semibold leading-[1.3] ${done ? 'text-muted line-through' : ''}`}>{t.title}</span>
      {t.blocked && (
        <span className="mc-leak text-xs font-bold text-startup border-[1.5px] border-startup rounded-lg px-2 py-[5px]">
          blocked{t.blockedReason ? ` · ${t.blockedReason}` : ''}
        </span>
      )}
      {t.subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-[3px] bg-surface-2 overflow-hidden">
            <div className="h-full bg-lime" style={{ width: `${Math.round((subDone / t.subtasks.length) * 100)}%` }} />
          </div>
          <span className="font-mono text-[11px] text-muted">
            {subDone}/{t.subtasks.length}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-ink px-2 py-[3px] rounded-full" style={{ background: CAT_COLORS[t.cat] }}>
          {t.cat}
        </span>
        <span className="font-mono text-[11px] text-muted flex-1">{done && t.doneAt ? `done ${format(new Date(t.doneAt), 'd MMM').toLowerCase()}` : formatDue(t.due)}</span>
        <span
          aria-label={`${t.points} story points`}
          className="min-w-6 h-6 rounded-lg bg-surface-2 border-[1.5px] border-line-strong flex items-center justify-center font-mono text-[11.5px] font-semibold"
        >
          {t.points}
        </span>
      </div>
    </article>
  )
}
