import { CAT_COLORS } from '../../lib/defaults'
import { hourLabel } from '../../lib/dates'
import type { PlanBlock } from '../../lib/metrics'

export function UpNext({ blocks }: { blocks: PlanBlock[] }) {
  return (
    <section className="bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] flex flex-col gap-3">
      <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em]">up next</h2>
      {blocks.length === 0 ? (
        <p className="m-0 text-sm text-muted">nothing else planned today. plan an hour on the strip above.</p>
      ) : (
        blocks.map((b) => (
          <div key={b.hours[0]} className="grid grid-cols-[52px_10px_minmax(0,1fr)] gap-2.5 items-center">
            <span className="font-mono text-xs text-muted">{hourLabel(b.hours[0])}:00</span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[b.cat] }} />
            <span className="text-sm font-semibold">{b.label || b.cat}</span>
          </div>
        ))
      )}
    </section>
  )
}
