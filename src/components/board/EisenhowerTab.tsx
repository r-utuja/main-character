import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { shiftKey } from '../../lib/dates'
import { isUrgent, quadrantOf, type Quadrant } from '../../lib/metrics'
import type { Ticket } from '../../types'
import { TicketCard } from './TicketCard'

const QUADRANTS: { id: Quadrant; title: string; sub: string }[] = [
  { id: 'do', title: 'do now', sub: 'urgent · important' },
  { id: 'plan', title: 'plan it', sub: 'important · not urgent' },
  { id: 'squeeze', title: 'squeeze in', sub: 'urgent · less important' },
  { id: 'later', title: 'maybe later', sub: 'no rush · no pressure' },
]

interface Props {
  tickets: Ticket[] // open tickets
  today: string
  onChange: (t: Ticket, patch: Partial<Pick<Ticket, 'priority' | 'due'>>) => void
  onOpen: (t: Ticket) => void
}

function Cell({ id, title, sub, children }: { id: Quadrant; title: string; sub: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section
      ref={setNodeRef}
      className="bg-[#17151C] rounded-[18px] p-3 flex flex-col gap-2.5 min-h-[180px]"
      style={{ border: isOver ? '1.5px solid #CDF56A' : '1.5px solid #2E2A36' }}
    >
      <div className="flex items-baseline justify-between px-1">
        <h3 className="m-0 font-display text-lg font-extrabold">{title}</h3>
        <span className="font-mono text-[10.5px] text-muted">{sub}</span>
      </div>
      {children}
    </section>
  )
}

export function EisenhowerTab({ tickets, today, onChange, onOpen }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (e: DragEndEvent) => {
    const target = e.over?.id as Quadrant | undefined
    const t = tickets.find((x) => x.id === e.active.id)
    if (!target || !t || quadrantOf(t, today) === target) return
    const wantImportant = target === 'do' || target === 'plan'
    const wantUrgent = target === 'do' || target === 'squeeze'
    const patch: Partial<Pick<Ticket, 'priority' | 'due'>> = {}
    if (wantImportant && t.priority === 'low') patch.priority = 'high'
    if (!wantImportant && t.priority !== 'low') patch.priority = 'low'
    if (wantUrgent && !isUrgent(t.due, today)) patch.due = shiftKey(today, 2)
    if (!wantUrgent && isUrgent(t.due, today)) patch.due = shiftKey(today, 7)
    onChange(t, patch)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <p className="m-0 text-sm text-muted">urgent = due within 3 days. important = high or medium priority. drag a ticket to change its priority or due date.</p>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        {QUADRANTS.map((q) => (
          <Cell key={q.id} {...q}>
            {tickets
              .filter((t) => quadrantOf(t, today) === q.id)
              .map((t) => (
                <TicketCard key={t.id} ticket={t} onOpen={onOpen} />
              ))}
          </Cell>
        ))}
      </div>
    </DndContext>
  )
}
