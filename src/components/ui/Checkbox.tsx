interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

/** 30px rounded square, lime when checked. The hit area is 44px. */
export function Checkbox({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-11 h-11 inline-flex items-center justify-center bg-transparent border-0 p-0"
    >
      <span
        className={`w-[30px] h-[30px] rounded-lg border-2 inline-flex items-center justify-center ${
          checked ? 'bg-lime border-lime' : 'border-[#7A7188]'
        }`}
      >
        {checked && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#121016" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
    </button>
  )
}
