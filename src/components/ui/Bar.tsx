interface Props {
  /** 0 to 1. Anything else is clamped, so divide-by-zero results (NaN) render as empty. */
  value: number
  color?: string
  height?: number
}

export function Bar({ value, color = '#CDF56A', height = 10 }: Props) {
  const pct = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) * 100 : 0
  return (
    <div className="bg-surface-2 rounded overflow-hidden" style={{ height }}>
      <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
