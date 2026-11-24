import { Link } from 'react-router-dom'
import { CAT_COLORS } from '../../lib/defaults'
import type { WorkCat } from '../../types'

interface Props {
  rows: { cat: WorkCat; spent: number; planned: number }[]
}

export function WeekSnapshot({ rows }: Props) {
  return (
    <Link
      to="/track"
      className="flex flex-col gap-3 bg-surface border-[1.5px] border-line rounded-card px-5 py-[18px] no-underline text-text hover:text-text"
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">THIS WEEK · SPENT / PLANNED</span>
        <span className="text-[12.5px] font-bold text-lime">track →</span>
      </div>
      {rows.map((r) => (
        <div key={r.cat} className="grid grid-cols-[92px_minmax(0,1fr)_62px] gap-2.5 items-center">
          <span className="text-[13px] font-semibold">{r.cat}</span>
          <div className="h-2.5 rounded bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: `${r.planned ? Math.min(100, Math.round((r.spent / r.planned) * 100)) : 0}%`, background: CAT_COLORS[r.cat] }}
            />
          </div>
          <span className="font-mono text-[11.5px] font-semibold text-right">
            {r.spent}/{r.planned}h
          </span>
        </div>
      ))}
    </Link>
  )
}
