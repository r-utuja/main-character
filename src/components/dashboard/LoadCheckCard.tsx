import type { LoadCheck } from '../../lib/metrics'

const VERDICT = { good: "you're good", tight: 'tight but doable', over: 'overbooked: move something' } as const

interface Props {
  mvd: boolean
  load: LoadCheck
  realityFactor: number
  hasTasks: boolean
}

const round = (n: number) => Math.round(n * 10) / 10

export function LoadCheckCard({ mvd, load, realityFactor, hasTasks }: Props) {
  const color = load.verdict === 'over' ? '#FFA36C' : '#CDF56A'
  let verdict: string
  let line: string
  let note: string
  let pct: number
  if (mvd) {
    verdict = 'light day, no pressure'
    line = '3 tiny wins · that is enough today'
    note = 'everything else moves to tomorrow automatically. nothing is marked overdue.'
    pct = 14
  } else if (!hasTasks) {
    verdict = 'nothing to check yet'
    line = 'add your big 3 to see the load'
    note = `estimates get multiplied by ${realityFactor} before comparing to your free hours.`
    pct = 0
  } else {
    verdict = VERDICT[load.verdict]
    line = `${round(load.plannedMin / 60)}h planned × ${realityFactor} = ${round(load.adjustedHours)}h of ${round(load.freeHours)}h free`
    note = `you usually take ${realityFactor}× your estimates. adding more today = spillover.`
    pct = Number.isFinite(load.ratio) ? Math.min(100, load.ratio * 100) : 100
  }
  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-4 flex flex-col gap-2.5">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">LOAD CHECK</span>
        <span className="text-xs font-bold" style={{ color: mvd ? '#B8A6FF' : color }}>
          {verdict}
        </span>
      </div>
      <span className="font-display text-[20px] font-bold">{line}</span>
      <div className="h-2.5 rounded-[5px] bg-surface-2 overflow-hidden">
        <div className="h-full rounded-[5px]" style={{ width: `${pct}%`, background: mvd ? '#B8A6FF' : color }} />
      </div>
      <span className="text-[12.5px] leading-[1.4] text-muted">{note}</span>
    </section>
  )
}
