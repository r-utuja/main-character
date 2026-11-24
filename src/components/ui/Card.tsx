import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  hero?: boolean
}

export function Card({ hero = false, className = '', ...rest }: Props) {
  const look = hero ? 'rounded-hero p-6' : 'rounded-card p-5'
  return <div className={`relative bg-surface border-[1.5px] border-line ${look} ${className}`} {...rest} />
}
