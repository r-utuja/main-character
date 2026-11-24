import { useState } from 'react'
import { deleteField, doc, documentId, updateDoc, where } from 'firebase/firestore'
import { SprintSnapshot } from '../components/dashboard/SprintSnapshot'
import { useAuth } from '../hooks/useAuth'
import { db } from '../lib/firebase'
import { statusPatch } from '../lib/tickets'
import { safeWrite } from '../lib/write'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { format } from 'date-fns'
import { Big3 } from '../components/dashboard/Big3'
import { LoadCheckCard } from '../components/dashboard/LoadCheckCard'
import { Rituals, type RitualView } from '../components/dashboard/Rituals'
import { RightNow } from '../components/dashboard/RightNow'
import { UpNext } from '../components/dashboard/UpNext'
import { WeekSnapshot } from '../components/dashboard/WeekSnapshot'
import { DayStrip } from '../components/day/DayStrip'
import { SlotEditor } from '../components/day/SlotEditor'
import { Segmented } from '../components/ui/Segmented'
import { useCollection } from '../hooks/useCollection'
import { useDay } from '../hooks/useDay'
import { useNow } from '../hooks/useNow'
import { useUserDoc } from '../hooks/useUserDoc'
import { dayEndsAt, dayKey, formatDuration, formatTime, hourOrder, isoWeekRange, lastKeys, shiftKey } from '../lib/dates'
import { freeHoursLeft, habitStreak, hoursSpent, loadCheck, missedYesterday, planBlocks, sprintDay, sprintPoints, type HabitDay } from '../lib/metrics'
import type { Big3Task, DayDoc, Habit, Sprint, Ticket } from '../types'

const WEEK_CATS = ['college', 'placement', 'exploration', 'startup'] as const

export default function Dashboard() {
  const { settings } = useUserDoc()
  const now = useNow()
  const start = settings.dayStartHour
  const today = dayKey(now, start)
  const { day, loading, patch, setSlots } = useDay(today)
  const [editing, setEditing] = useState<{ kind: 'plan' | 'actual'; hour: number } | null>(null)
  const [whatNowId, setWhatNowId] = useState<string | null>(null)

  const histFrom = shiftKey(today, -60)
  const { items: history } = useCollection<Partial<DayDoc>>(
    'days',
    [where(documentId(), '>=', histFrom), where(documentId(), '<=', today)],
    histFrom + today,
  )
  const { items: allHabits } = useCollection<Omit<Habit, 'id'>>('habits')
  const { items: tickets } = useCollection<Omit<Ticket, 'id'>>('tickets')
  const { items: sprints } = useCollection<Omit<Sprint, 'id'>>('sprints')
  const { user } = useAuth()

  const activeSprint = sprints.find((s) => s.status === 'active')
  const sprintTickets = activeSprint ? tickets.filter((t) => t.sprintId === activeSprint.id) : []
  const sprintLen = activeSprint ? differenceInCalendarDays(parseISO(activeSprint.end), parseISO(activeSprint.start)) + 1 : settings.sprintLengthDays
  const openTickets = tickets.filter((t) => t.status !== 'done')
  /** Ticking a linked big-3 task moves its ticket too. */
  const onBig3Toggled = (task: Big3Task, done: boolean) => {
    const uid = user?.uid
    if (!uid || !task.ticketId) return
    const id = task.ticketId
    void safeWrite(() => updateDoc(doc(db, 'users', uid, 'tickets', id), statusPatch(done ? 'done' : 'progress')))
  }

  const byDate = new Map(history.map((d) => [d.id, d]))
  const getDay = (offset: number): HabitDay | undefined => byDate.get(shiftKey(today, -offset))

  const order = hourOrder(start)
  const nowHour = now.getHours()
  const nowPos = order.indexOf(nowHour)
  const blocks = planBlocks(day.plan, order)
  const current = blocks.find((b) => b.hours.includes(nowHour))
  const upcoming = blocks.filter((b) => order.indexOf(b.hours[0]) > nowPos).slice(0, 4)

  const frog = day.big3.find((t) => !t.done)
  const whatNow = day.big3.find((t) => t.id === whatNowId) ?? null
  const load = loadCheck(day.big3, settings.realityFactor, freeHoursLeft(day.plan, order, nowHour, now.getMinutes()))

  const habits = allHabits
    .filter((h) => !h.archived)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6)
  const rituals: RitualView[] = habits.map((habit) => ({
    habit,
    done: !!day.habits[habit.id],
    streak: habitStreak(habit.id, getDay),
    missed: missedYesterday(habit.id, getDay),
  }))

  const week = isoWeekRange(today)
  const weekDays = lastKeys(today, 7)
    .filter((k) => k >= week.start)
    .map((k) => byDate.get(k) ?? {})
  const weekRows = WEEK_CATS.map((cat) => ({ cat, spent: hoursSpent(weekDays, cat), planned: settings.weeklyBudgetHours[cat] ?? 0 }))

  const left = dayEndsAt(today, start).getTime() - now.getTime()
  const resets = `${String(start).padStart(2, '0')}:00`

  const setBig3 = (tasks: Big3Task[]) => void patch({ big3: tasks })
  const toggleMvd = (i: number) => {
    const next = [...day.mvdDone]
    while (next.length < 3) next.push(false)
    next[i] = !next[i]
    void patch({ mvdDone: next })
  }
  const toggleHabit = (habit: Habit, done: boolean) =>
    void patch({ habits: { [habit.id]: done ? (day.mvd ? 'tiny' : 'full') : deleteField() } })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3.5">
          <span className="font-display text-[34px] font-extrabold tracking-[-0.03em]">{formatTime(now)}</span>
          <span className="font-mono text-xs tracking-[0.06em] text-muted">
            {format(now, 'EEE d MMM yyyy').toUpperCase()} · WK {format(now, 'II')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Day mode"
            value={day.mvd ? 'mvd' : 'full'}
            onChange={(v) => void patch({ mvd: v === 'mvd' })}
            options={[
              { value: 'full', label: 'full day' },
              { value: 'mvd', label: 'minimum viable day', activeBg: '#B8A6FF' },
            ]}
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('mc:capture'))}
            className="min-h-[46px] flex items-center gap-2.5 px-3.5 rounded-btn bg-lime border-0 text-ink font-extrabold text-sm shadow-hard-lilac"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#121016" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            capture
            <span className="font-mono text-[11px] font-semibold bg-ink/10 rounded-md px-1.5 py-[3px]">ctrl K</span>
          </button>
        </div>
      </div>

      {day.mvd && (
        <div className="flex items-center gap-3.5 bg-college text-ink rounded-2xl px-[18px] py-3.5">
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] bg-ink text-college px-[9px] py-[5px] rounded-[7px] -rotate-3">MVD ON</span>
          <span className="text-[15px] font-semibold">rough day? 3 tiny wins, then rest. streaks are protected and nothing turns red today.</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 font-display text-[60px] leading-[0.92] font-extrabold tracking-[-0.04em]">
          main character hours, <span className="text-college">{settings.name}.</span>
        </h1>
        <div className="flex flex-col items-end gap-1">
          <span className="font-display text-[26px] font-extrabold text-lime">{formatDuration(left)} left</span>
          <span className="font-mono text-[11px] text-muted">day resets at {resets === '00:00' ? '24:00' : resets}</span>
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</p>
      ) : (
        <>
          <DayStrip day={day} dayStartHour={start} now={now} onCellClick={(kind, hour) => setEditing({ kind, hour })} />

          <div className="grid gap-[22px] items-start [grid-template-columns:repeat(auto-fit,minmax(min(330px,100%),1fr))]">
            <div className="flex flex-col gap-[22px]">
              <RightNow
                block={current}
                nowHour={nowHour}
                mvd={day.mvd}
                whatNow={whatNow}
                frog={frog}
                onWhatNow={() => setWhatNowId(frog?.id ?? null)}
                onPlanThisHour={() => setEditing({ kind: 'plan', hour: nowHour })}
              />
              <Big3
                mvd={day.mvd}
                tasks={day.big3}
                mvdTasks={settings.mvdTasks}
                mvdDone={day.mvdDone}
                tickets={openTickets}
                onToggled={onBig3Toggled}
                onChange={setBig3}
                onToggleMvd={toggleMvd}
              />
            </div>

            <div className="flex flex-col gap-[22px]">
              <SprintSnapshot
                sprint={activeSprint}
                day={activeSprint ? sprintDay(activeSprint.start, today, sprintLen) : 1}
                length={sprintLen}
                points={sprintPoints(sprintTickets)}
                tickets={sprintTickets}
                wipLimit={settings.wipLimit}
              />
              <WeekSnapshot rows={weekRows} />
              <LoadCheckCard mvd={day.mvd} load={load} realityFactor={settings.realityFactor} hasTasks={day.big3.length > 0} />
            </div>

            <div className="flex flex-col gap-[22px]">
              <UpNext blocks={upcoming} />
              <Rituals mvd={day.mvd} rituals={rituals} onToggle={toggleHabit} />
            </div>
          </div>
        </>
      )}

      {editing && (
        <SlotEditor
          kind={editing.kind}
          hour={editing.hour}
          current={day[editing.kind][String(editing.hour)]}
          dayStartHour={start}
          onSave={(entries) => void setSlots(editing.kind, entries)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
