import { Link } from 'react-router-dom'
import { formatINR } from '../../lib/metrics'

export function SpentToday({ total, count }: { total: number; count: number }) {
  return (
    <Link
      to="/money"
      className="flex items-center justify-between gap-3 bg-surface border-[1.5px] border-line rounded-card px-5 py-4 no-underline text-text hover:text-text"
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted">SPENT TODAY</span>
        <span className="font-display text-[30px] font-extrabold tracking-[-0.03em]">{formatINR(total)}</span>
      </div>
      <span className="text-[13px] font-bold text-lime">
        {count} {count === 1 ? 'entry' : 'entries'} →
      </span>
    </Link>
  )
}
