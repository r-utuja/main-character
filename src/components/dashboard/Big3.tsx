import { useState } from 'react'
import { Checkbox } from '../ui/Checkbox'
import { Chip } from '../ui/Chip'
import { CAT_COLORS, WORK_CATS } from '../../lib/defaults'
import type { Big3Task, WorkCat } from '../../types'

interface Props {
  mvd: boolean
  tasks: Big3Task[]
  mvdTasks: string[]
  mvdDone: boolean[]
  onChange: (tasks: Big3Task[]) => void
  onToggleMvd: (index: number) => void
  /** Called after a task is ticked so linked tickets can follow. */
  onToggled?: (task: Big3Task, done: boolean) => void
}

export function Big3({ mvd, tasks, mvdTasks, mvdDone, onChange, onToggleMvd, onToggled }: Props) {
  const [title, setTitle] = useState('')
  const [cat, setCat] = useState<WorkCat>('college')
  const [est, setEst] = useState(30)

  const doneCount = mvd ? mvdDone.filter(Boolean).length : tasks.filter((t) => t.done).length

  const add = () => {
    if (!title.trim() || tasks.length >= 3) return
    const task: Big3Task = { id: crypto.randomUUID(), title: title.trim(), cat, estMin: Math.max(5, est || 30), done: false }
    onChange([...tasks, task])
    setTitle('')
  }

  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-5 pt-[18px] pb-2.5 flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">{mvd ? 'minimum viable day' : 'the big 3'}</h2>
        <span className="font-mono text-[11px] text-muted">{doneCount}/3 done</span>
      </div>

      {mvd
        ? mvdTasks.map((t, i) => (
            <div key={i} className="flex items-center gap-2 min-h-[60px] border-t border-[#2E2A36]">
              <Checkbox checked={!!mvdDone[i]} onChange={() => onToggleMvd(i)} label={`${mvdDone[i] ? 'Mark not done' : 'Mark done'}: ${t}`} />
              <span className={`flex-1 text-base font-semibold ${mvdDone[i] ? 'text-muted line-through' : ''}`}>{t}</span>
              <span className="font-mono text-[10.5px] text-muted">tiny win</span>
            </div>
          ))
        : tasks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2 min-h-[60px] border-t border-[#2E2A36]">
              <Checkbox
                checked={t.done}
                onChange={(done) => {
                  onChange(tasks.map((x) => (x.id === t.id ? { ...x, done } : x)))
                  onToggled?.(t, done)
                }}
                label={`${t.done ? 'Mark not done' : 'Mark done'}: ${t.title}`}
              />
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-semibold ${t.done ? 'text-muted line-through' : ''}`}>{t.title}</span>
                  {i === 0 && !t.done && (
                    <span className="font-mono text-[10px] font-semibold tracking-[0.06em] bg-startup text-ink px-[7px] py-[3px] rounded-md -rotate-4">
                      THE FROG
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted">
                  {Math.ceil(t.estMin / 25)} pomodoro{Math.ceil(t.estMin / 25) === 1 ? '' : 's'} · {t.estMin} min
                </span>
              </div>
              <span className="text-[11.5px] font-bold text-ink px-[9px] py-1 rounded-full shrink-0" style={{ background: CAT_COLORS[t.cat] }}>
                {t.cat}
              </span>
              <button
                type="button"
                aria-label={`Remove ${t.title}`}
                onClick={() => onChange(tasks.filter((x) => x.id !== t.id))}
                className="w-9 h-11 bg-transparent border-0 text-muted text-lg"
              >
                ×
              </button>
            </div>
          ))}

      {!mvd && tasks.length < 3 && (
        <form
          className="flex flex-col gap-2 border-t border-[#2E2A36] py-3"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <span className="font-mono text-[11px] text-muted">
            {tasks.length === 0 ? 'nothing here yet. what are the 3 that matter today? hardest first.' : `add task ${tasks.length + 1} of 3`}
          </span>
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="the frog (hardest thing first)"
              aria-label="task title"
              className="flex-1 min-w-0 min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text"
            />
            <input
              type="number"
              min={5}
              step={5}
              value={est}
              onChange={(e) => setEst(Number(e.target.value))}
              aria-label="estimate in minutes"
              className="w-[72px] min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-2 text-sm font-mono text-text"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {WORK_CATS.map((c) => (
              <Chip key={c} cat={c} selected={cat === c} onClick={() => setCat(c)} aria-pressed={cat === c}>
                {c}
              </Chip>
            ))}
            <button type="submit" disabled={!title.trim()} className="ml-auto min-h-[44px] px-4 rounded-btn bg-lime text-ink font-extrabold text-sm border-0 disabled:opacity-40">
              add
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
