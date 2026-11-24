import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Burndown, SprintPoints } from '../../lib/metrics'
import type { Sprint } from '../../types'

interface Props {
  sprint: Sprint
  day: number
  length: number
  points: SprintPoints
  overage: number | null
  avgVelocity: number | null
  burn: Burndown
  onGoal: (goal: string) => void
  onStartNext: () => void
}

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0)

export function SprintHeader({ sprint, day, length, points, overage, avgVelocity, burn, onGoal, onStartNext }: Props) {
  const [editing, setEditing] = useState(false)
  const [goal, setGoal] = useState(sprint.goal)

  return (
    <div className="grid gap-[22px] items-stretch [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
      <section className="flex flex-col gap-2.5 justify-center">
        <span className="font-mono text-xs tracking-[0.06em] text-muted">
          {format(parseISO(sprint.start), 'dd MMM').toUpperCase()} → {format(parseISO(sprint.end), 'dd MMM').toUpperCase()} · DAY {day} OF {length}
        </span>
        <h1 className="m-0 font-display text-[64px] leading-[0.88] font-extrabold tracking-[-0.045em]">
          sprint <span className="text-lime">{sprint.number}</span>
        </h1>
        <div className="border-[1.5px] border-dashed border-college rounded-[14px] px-3.5 py-2.5 flex flex-col gap-1">
          <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-college">SPRINT GOAL</span>
          {editing ? (
            <input
              autoFocus
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={() => {
                setEditing(false)
                if (goal !== sprint.goal) onGoal(goal)
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="min-h-[36px] bg-transparent border-0 text-[14.5px] font-semibold text-text p-0 outline-none"
              aria-label="sprint goal"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setGoal(sprint.goal)
                setEditing(true)
              }}
              className="text-left bg-transparent border-0 p-0 min-h-[28px] text-[14.5px] font-semibold leading-[1.35] text-text"
            >
              {sprint.goal || 'what is this sprint for? tap to set a goal.'}
            </button>
          )}
        </div>
        <button type="button" onClick={onStartNext} className="self-start min-h-[44px] px-4 rounded-btn bg-transparent border-2 border-line-strong text-text font-bold text-[13px]">
          start next sprint
        </button>
      </section>

      <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-3">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">STORY POINTS</span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[52px] font-extrabold tracking-[-0.04em] leading-none text-lime">{points.done}</span>
          <span className="font-display text-2xl font-bold text-muted">/ {points.committed} done</span>
        </div>
        <div className="flex h-3 rounded-md overflow-hidden bg-surface-2 gap-0.5">
          <div style={{ width: `${pct(points.done, points.committed)}%`, background: '#CDF56A' }} />
          <div style={{ width: `${pct(points.review, points.committed)}%`, background: '#B8A6FF' }} />
          <div style={{ width: `${pct(points.progress, points.committed)}%`, background: '#6E6580' }} />
        </div>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-muted">
          <span>done {points.done}</span>
          <span>in review {points.review}</span>
          <span>in progress {points.progress}</span>
          <span>to do {points.todo}</span>
        </div>
        {overage !== null && avgVelocity !== null && (
          <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-startup px-2.5 py-2" style={{ background: 'rgba(255,163,108,0.12)' }}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFA36C" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 8v5M12 16.5v.5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span className="text-[12.5px] font-semibold text-[#FFC9A6]">
              {points.committed} committed vs {Math.round(avgVelocity)} avg velocity. move {overage} pts out?
            </span>
          </div>
        )}
      </section>

      <BurndownCard burn={burn} length={length} />
    </div>
  )
}

function BurndownCard({ burn, length }: { burn: Burndown; length: number }) {
  const W = 290
  const H = 100
  const x = (i: number) => 20 + (length <= 1 ? 0 : (i / (length - 1)) * W)
  const y = (v: number) => 10 + (burn.committed > 0 ? (1 - v / burn.committed) * H : H)
  const line = burn.remaining.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('')
  const lastIdx = burn.remaining.length - 1
  const left = burn.remaining[lastIdx] ?? burn.committed
  const ideal = burn.ideal[lastIdx] ?? burn.committed
  const verdict = left <= ideal ? 'ahead of ideal' : 'a bit behind ideal. still fine.'
  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-2.5">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">BURNDOWN</span>
        <span className="text-xs font-bold text-lime">{burn.committed === 0 ? 'no points yet' : verdict}</span>
      </div>
      <svg role="img" aria-label={`Burndown: ${burn.committed} points at start, ${left} left today, ideal line reaches zero on day ${length}`} viewBox="0 0 320 140" width="100%" height="150" preserveAspectRatio="none" fill="none">
        <path d="M20 10H310M20 60H310M20 110H310" stroke="#2E2A36" strokeWidth="1" />
        <path d={`M${x(0)} ${y(burn.committed)}L${x(length - 1)} ${y(0)}`} stroke="#6E6580" strokeWidth="2" strokeDasharray="5 5" />
        {line && <path d={line} stroke="#CDF56A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
        {lastIdx >= 0 && <circle cx={x(lastIdx)} cy={y(left)} r="5.5" fill="#CDF56A" stroke="#1D1A23" strokeWidth="2" />}
        <text x="0" y="14" fill="#ABA3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">{burn.committed}</text>
        <text x="6" y="114" fill="#ABA3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">0</text>
        <text x="20" y="134" fill="#ABA3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">d1</text>
        <text x="288" y="134" fill="#ABA3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">d{length}</text>
        {lastIdx >= 0 && (
          <text x={Math.min(x(lastIdx) + 10, 262)} y={Math.max(y(left) - 4, 24)} fill="#CDF56A" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            {left} left
          </text>
        )}
      </svg>
    </section>
  )
}
