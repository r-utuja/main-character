import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: Props) {
  const base = 'min-h-[44px] px-4 rounded-btn text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50'
  const look =
    variant === 'primary'
      ? 'bg-lime text-ink font-extrabold shadow-hard-lilac border-0'
      : 'bg-transparent text-text font-bold border-2 border-line-strong hover:bg-surface'
  return <button type={type} className={`${base} ${look} ${className}`} {...rest} />
}
