import { useState } from 'react'
import { format } from 'date-fns'
import { DayStrip } from '../components/day/DayStrip'
import { SlotEditor } from '../components/day/SlotEditor'
import { useDay } from '../hooks/useDay'
import { useNow } from '../hooks/useNow'
import { useUserDoc } from '../hooks/useUserDoc'
import { dayEndsAt, dayKey, formatDuration, formatTime } from '../lib/dates'

export default function Dashboard() {
  const { settings } = useUserDoc()
  const now = useNow()
  const start = settings.dayStartHour
  const today = dayKey(now, start)
  const { day, loading, setSlots } = useDay(today)
  const [editing, setEditing] = useState<{ kind: 'plan' | 'actual'; hour: number } | null>(null)

  const left = dayEndsAt(today, start).getTime() - now.getTime()
  const resets = `${String(start).padStart(2, '0')}:00`

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3.5">
          <span className="font-display text-[34px] font-extrabold tracking-[-0.03em]">{formatTime(now)}</span>
          <span className="font-mono text-xs tracking-[0.06em] text-muted">
            {format(now, 'EEE d MMM yyyy').toUpperCase()} · WK {format(now, 'II')}
          </span>
        </div>
      </div>

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
        <DayStrip day={day} dayStartHour={start} now={now} onCellClick={(kind, hour) => setEditing({ kind, hour })} />
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
