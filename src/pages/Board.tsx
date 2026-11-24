import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { BacklogTab } from '../components/board/BacklogTab'
import { EisenhowerTab } from '../components/board/EisenhowerTab'
import { EpicsRow } from '../components/board/EpicsRow'
import { SprintHeader } from '../components/board/SprintHeader'
import { TicketCard } from '../components/board/TicketCard'
import { TicketPanel, updatePatch, type TicketDraft } from '../components/board/TicketPanel'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useNow } from '../hooks/useNow'
import { useUserDoc } from '../hooks/useUserDoc'
import { CAT_COLORS, WORK_CATS } from '../lib/defaults'
import { dayKey } from '../lib/dates'
import { db } from '../lib/firebase'
import { burndown, sprintDay, sprintPoints, velocity, velocityOverage } from '../lib/metrics'
import { createTicket, moveTicket, startNextSprint, statusPatch } from '../lib/tickets'
import { safeWrite } from '../lib/write'
import type { Epic, Sprint, Ticket, TicketStatus, WorkCat } from '../types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

type Tab = 'board' | 'backlog' | 'eisenhower'
type Filter = 'all' | WorkCat

const COLUMNS: { status: TicketStatus; name: string }[] = [
  { status: 'todo', name: 'TO DO' },
  { status: 'progress', name: 'IN PROGRESS' },
  { status: 'review', name: 'IN REVIEW' },
  { status: 'done', name: 'DONE' },
]

function Column({ status, name, count, wip, children }: { status: TicketStatus; name: string; count: number; wip?: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      className="bg-[#17151C] rounded-[18px] p-3 flex flex-col gap-2.5 min-h-[160px]"
      style={{ border: isOver ? '1.5px solid #CDF56A' : '1.5px solid #2E2A36' }}
    >
      <div className="flex justify-between items-center px-1 pt-1 pb-0.5 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="m-0 font-mono text-xs font-semibold tracking-[0.08em]">{name}</h3>
          <span className="font-mono text-[11px] text-muted">{count}</span>
        </div>
        {wip && <span className="font-mono text-[10.5px] font-semibold text-ink bg-startup px-2 py-1 rounded-[7px] rotate-2">{wip}</span>}
      </div>
      {children}
    </section>
  )
}

export default function Board() {
  const { user } = useAuth()
  const uid = user?.uid
  const { settings } = useUserDoc()
  const now = useNow()
  const today = dayKey(now, settings.dayStartHour)

  const { items: tickets, loading: lt } = useCollection<Omit<Ticket, 'id'>>('tickets')
  const { items: sprints, loading: ls } = useCollection<Omit<Sprint, 'id'>>('sprints')
  const { items: epics } = useCollection<Omit<Epic, 'id'>>('epics')

  const [tab, setTab] = useState<Tab>('board')
  const [filter, setFilter] = useState<Filter>('all')
  const [panel, setPanel] = useState<{ ticket?: Ticket } | null>(null)
  const [wipAsk, setWipAsk] = useState<Ticket | null>(null)
  const [confirmNext, setConfirmNext] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const active = sprints.find((s) => s.status === 'active')
  const sprintTickets = active ? tickets.filter((t) => t.sprintId === active.id) : []
  const backlog = tickets.filter((t) => !t.sprintId && t.status !== 'done')
  const openTickets = tickets.filter((t) => t.status !== 'done')
  const wip = settings.wipLimit
  const inProgress = sprintTickets.filter((t) => t.status === 'progress').length
  const length = active ? differenceInCalendarDays(parseISO(active.end), parseISO(active.start)) + 1 : settings.sprintLengthDays
  const points = sprintPoints(sprintTickets)
  const avg = velocity(sprints)
  const overage = velocityOverage(points.committed, avg)
  const keyOf = (ms: number) => dayKey(new Date(ms), settings.dayStartHour)
  const burn = burndown(sprintTickets, active?.start ?? today, length, today, keyOf)

  if (lt || ls) return <p className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</p>

  const run = (fn: () => Promise<unknown>) => {
    if (uid) void safeWrite(fn)
  }

  const doMove = (t: Ticket, status: TicketStatus) => {
    if (uid) void safeWrite(() => moveTicket(uid, t, status, today))
  }

  const onDragEnd = (e: DragEndEvent) => {
    const status = e.over?.id as TicketStatus | undefined
    const t = sprintTickets.find((x) => x.id === e.active.id)
    if (!status || !t || t.status === status) return
    if (status === 'progress' && inProgress >= wip) setWipAsk(t)
    else doMove(t, status)
  }

  const savePanel = (d: TicketDraft) => {
    if (!uid) return
    const existing = panel?.ticket
    if (existing) {
      run(async () => {
        await updateDoc(doc(db, 'users', uid, 'tickets', existing.id), updatePatch(d))
        if (d.status !== existing.status) await moveTicket(uid, { ...existing, ...d, id: existing.id } as Ticket, d.status, today)
      })
    } else {
      run(() =>
        createTicket(uid, {
          title: d.title.trim(),
          cat: d.cat,
          points: d.points,
          priority: d.priority,
          status: 'todo',
          sprintId: active?.id,
          epicId: d.epicId || undefined,
          due: d.due || undefined,
          blocked: d.blocked,
          blockedReason: d.blocked ? d.blockedReason.trim() : '',
          subtasks: d.subtasks,
        }),
      )
    }
    setPanel(null)
  }

  const deleteTicket = () => {
    const t = panel?.ticket
    if (uid && t) run(() => deleteDoc(doc(db, 'users', uid, 'tickets', t.id)))
    setPanel(null)
  }

  const shown = (list: Ticket[]) => (filter === 'all' ? list : list.filter((t) => t.cat === filter))

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`min-h-[38px] px-4 rounded-[10px] border-0 text-[13px] font-bold ${tab === id ? 'bg-text text-ink' : 'bg-transparent text-muted'}`}
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Board views" className="flex bg-surface border-[1.5px] border-line rounded-btn p-1">
          {tabBtn('board', 'board')}
          {tabBtn('backlog', 'backlog')}
          {tabBtn('eisenhower', 'eisenhower')}
        </div>
        <button
          type="button"
          onClick={() => setPanel({})}
          className="min-h-[46px] flex items-center gap-2 px-4 rounded-btn bg-lime border-0 text-ink font-extrabold text-sm shadow-hard-lilac"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#121016" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          new ticket
        </button>
      </div>

      {!active && tab === 'board' ? (
        <section className="bg-surface border-[1.5px] border-line rounded-card px-6 py-8 flex flex-col gap-3 items-start max-w-[560px]">
          <h1 className="m-0 font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.04em]">a clean slate.</h1>
          <p className="m-0 text-[15px] text-text-soft">no sprint running. a sprint is a {settings.sprintLengthDays}-day box with one goal. start one and pull tickets in from the backlog.</p>
          <Button onClick={() => uid && run(() => startNextSprint(uid, undefined, sprints, tickets, today, settings.sprintLengthDays))}>start sprint {sprints.reduce((m, s) => Math.max(m, s.number), 0) + 1}</Button>
        </section>
      ) : null}

      {active && tab === 'board' && (
        <>
          <SprintHeader
            sprint={active}
            day={sprintDay(active.start, today, length)}
            length={length}
            points={points}
            overage={overage}
            avgVelocity={avg}
            burn={burn}
            onGoal={(goal) => uid && run(() => updateDoc(doc(db, 'users', uid, 'sprints', active.id), { goal }))}
            onStartNext={() => setConfirmNext(true)}
          />
        </>
      )}

      {tab === 'board' && (
        <EpicsRow
          epics={epics}
          tickets={tickets}
          onAdd={(e) => uid && run(() => addDoc(collection(db, 'users', uid, 'epics'), e))}
          onDelete={(e) => uid && run(() => deleteDoc(doc(db, 'users', uid, 'epics', e.id)))}
        />
      )}

      {tab === 'board' && active && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.08em] text-muted mr-1">FILTER</span>
            {(['all', ...WORK_CATS] as Filter[]).map((f) => {
              const on = filter === f
              const color = f === 'all' ? '#F3EFE7' : CAT_COLORS[f]
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f)}
                  className={`min-h-[36px] px-3.5 rounded-full text-[12.5px] font-bold ${on ? 'text-ink' : 'bg-transparent text-text-soft border-[1.5px] border-line-strong'}`}
                  style={on ? { background: color, border: `1.5px solid ${color}` } : undefined}
                >
                  {f}
                </button>
              )
            })}
          </div>

          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid gap-4 items-start [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]">
              {COLUMNS.map((c) => {
                const list = shown(sprintTickets.filter((t) => t.status === c.status))
                return (
                  <Column
                    key={c.status}
                    status={c.status}
                    name={c.name}
                    count={list.length}
                    wip={c.status === 'progress' && inProgress >= wip ? `WIP ${inProgress}/${wip} · FULL` : undefined}
                  >
                    {list.map((t) => (
                      <TicketCard key={t.id} ticket={t} onOpen={(x) => setPanel({ ticket: x })} />
                    ))}
                    {list.length === 0 && <span className="text-xs text-muted px-1 py-2">{c.status === 'done' ? 'wins land here.' : 'drop a ticket here.'}</span>}
                  </Column>
                )
              })}
            </div>
          </DndContext>
        </>
      )}

      {tab === 'backlog' && (
        <BacklogTab
          tickets={shown(backlog)}
          hasSprint={!!active}
          onOpen={(t) => setPanel({ ticket: t })}
          onAddToSprint={(t) => uid && active && run(() => updateDoc(doc(db, 'users', uid, 'tickets', t.id), { sprintId: active.id, ...statusPatch('todo') }))}
        />
      )}

      {tab === 'eisenhower' && (
        <EisenhowerTab
          tickets={openTickets}
          today={today}
          onOpen={(t) => setPanel({ ticket: t })}
          onChange={(t, patch) => uid && run(() => updateDoc(doc(db, 'users', uid, 'tickets', t.id), patch))}
        />
      )}

      {panel && (
        <TicketPanel
          key={panel.ticket?.id ?? 'new'}
          ticket={panel.ticket}
          epics={epics}
          onSave={savePanel}
          onDelete={deleteTicket}
          onClose={() => setPanel(null)}
        />
      )}

      <Modal open={!!wipAsk} onClose={() => setWipAsk(null)} title="WIP limit">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 font-display text-[26px] font-extrabold">finish something first?</h2>
          <p className="m-0 text-sm text-text-soft">
            in progress is full ({inProgress}/{wip}). fewer things at once means more things actually done.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setWipAsk(null)}>ok, finish something</Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (wipAsk) doMove(wipAsk, 'progress')
                setWipAsk(null)
              }}
            >
              move it anyway
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmNext} onClose={() => setConfirmNext(false)} title="Start next sprint">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 font-display text-[26px] font-extrabold">fresh start?</h2>
          <p className="m-0 text-sm text-text-soft">
            this closes sprint {active?.number} with {points.done} points done. unfinished tickets carry over to the new sprint. nothing is lost.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (uid) run(() => startNextSprint(uid, active, sprints, tickets, today, settings.sprintLengthDays))
                setConfirmNext(false)
              }}
            >
              start sprint {(active?.number ?? 0) + 1}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmNext(false)}>
              not yet
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

