import type { ReactNode } from 'react'
import type { Habit } from '../../types'

const P = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

const ICONS: Record<string, ReactNode> = {
  move: <svg {...P}><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /></svg>,
  breathe: <svg {...P}><path d="M3 9h11a3 3 0 1 0-3-3M3 15h14a3 3 0 1 1-3 3M3 12h7" /></svg>,
  piano: <svg {...P}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M8 5v8M12 5v8M16 5v8M8 13v6M12 13v6M16 13v6" /></svg>,
  language: <svg {...P}><path d="M4 5h16v11H10l-5 4v-4H4z" /><path d="M9.5 13l2.5-5.5 2.5 5.5M10.4 11h3.2" /></svg>,
  read: <svg {...P}><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13" /></svg>,
}

export function HabitIcon({ icon }: { icon: string }) {
  return ICONS[icon] ?? <svg {...P}><circle cx="12" cy="12" r="7" /></svg>
}

export interface RitualView {
  habit: Habit
  done: boolean
  streak: number
  missed: boolean
}

interface Props {
  mvd: boolean
  rituals: RitualView[]
  onToggle: (habit: Habit, done: boolean) => void
}

export function Rituals({ mvd, rituals, onToggle }: Props) {
  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-4 pt-[18px] pb-4 flex flex-col gap-3.5">
      <div className="flex justify-between items-baseline px-1">
        <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">rituals</h2>
        <span className="font-mono text-[11px] text-muted">{mvd ? 'tiny versions count' : 'never miss twice'}</span>
      </div>
      {rituals.length === 0 ? (
        <p className="m-0 px-1 text-sm text-muted">no rituals yet. add some in settings.</p>
      ) : (
        <div className="grid gap-1 [grid-template-columns:repeat(auto-fit,minmax(62px,1fr))]">
          {rituals.map(({ habit, done, streak, missed }) => {
            const showMissed = missed && !done
            const btn = done
              ? { background: habit.color, border: `2px solid ${habit.color}`, color: '#121016' }
              : showMissed
                ? { background: 'transparent', border: '2.5px dashed #FFA36C', color: '#F3EFE7' }
                : { background: 'transparent', border: '2px solid #7A7188', color: '#F3EFE7' }
            let sub = `${streak}d`
            let subCls = 'text-muted'
            if (mvd) {
              sub = habit.tiny
              subCls = 'text-college'
            } else if (showMissed) {
              sub = 'save it'
              subCls = 'text-startup font-semibold'
            } else if (missed && done) {
              sub = 'saved'
              subCls = 'text-lime font-semibold'
            }
            return (
              <div key={habit.id} className="flex flex-col items-center gap-1.5 text-center">
                <button
                  type="button"
                  aria-label={`${habit.name}, ${done ? 'done today' : 'not done yet'}`}
                  aria-pressed={done}
                  onClick={() => onToggle(habit, !done)}
                  className="w-[54px] h-[54px] rounded-full box-border flex items-center justify-center p-0"
                  style={btn}
                >
                  <HabitIcon icon={habit.icon} />
                </button>
                <span className="text-xs font-semibold">{habit.name}</span>
                <span className={`font-mono text-[10.5px] ${subCls}`}>{sub}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
