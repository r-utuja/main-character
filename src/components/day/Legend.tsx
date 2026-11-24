import { CAT_COLORS, SLOT_CATS } from '../../lib/defaults'
import type { SlotCat } from '../../types'

export function CatSwatch({ cat }: { cat: SlotCat }) {
  if (cat === 'leak') return <span className="mc-leak w-2.5 h-2.5 rounded-[3px] border border-startup" />
  if (cat === 'sleep') return <span className="w-2.5 h-2.5 rounded-[3px] bg-sleep border border-line-strong" />
  return <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: CAT_COLORS[cat] }} />
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-muted">
      {SLOT_CATS.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <CatSwatch cat={c} />
          {c}
        </span>
      ))}
    </div>
  )
}
