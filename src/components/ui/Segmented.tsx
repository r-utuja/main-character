interface Option<T extends string> {
  value: T
  label: string
  /** Active fill colour override (lilac for MVD). */
  activeBg?: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex bg-surface border-[1.5px] border-line rounded-btn p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            style={active ? { background: o.activeBg ?? '#F3EFE7', color: '#121016' } : undefined}
            className={`min-h-[36px] px-3.5 rounded-[10px] text-[13px] font-bold ${active ? '' : 'text-muted'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
