import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

/** Small floating panel. Place inside a `relative` parent. Closes on Esc or outside click. */
export function Popover({ open, onClose, children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div ref={ref} className={`absolute z-40 bg-surface border-[1.5px] border-line-strong rounded-card p-3 ${className}`}>
      {children}
    </div>
  )
}
