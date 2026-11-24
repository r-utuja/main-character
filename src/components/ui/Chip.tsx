import type { ButtonHTMLAttributes } from 'react'
import { CAT_COLORS } from '../../lib/defaults'
import type { SlotCat } from '../../types'

/** Category chip: filled in the category colour. As a filter chip, unselected = outlined. */
interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  cat?: SlotCat
  selected?: boolean
}

export function Chip({ cat, selected = true, className = '', children, type = 'button', ...rest }: Props) {
  const color = cat ? CAT_COLORS[cat] : '#CDF56A'
  const style = selected ? { background: color, color: '#121016' } : undefined
  const look = selected ? '' : 'border-[1.5px] border-line-strong text-text-soft'
  return (
    <button
      type={type}
      style={style}
      className={`min-h-[30px] px-3 rounded-full text-xs font-bold ${look} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
