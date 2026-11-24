import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Background colour, defaults to ink on lime text like the RIGHT NOW sticker. */
  bg?: string
  fg?: string
  rotate?: number
  /** Overlap the top edge of the parent card (parent must be relative). */
  overlap?: boolean
}

export function Sticker({ children, bg = '#121016', fg = '#CDF56A', rotate = -4, overlap = false }: Props) {
  const pos = overlap ? 'absolute -top-[13px] left-[18px]' : 'inline-block'
  return (
    <span
      style={{ background: bg, color: fg, transform: `rotate(${rotate}deg)` }}
      className={`${pos} font-mono text-[11px] font-semibold uppercase tracking-[0.08em] px-[11px] py-[6px] rounded-lg`}
    >
      {children}
    </span>
  )
}
