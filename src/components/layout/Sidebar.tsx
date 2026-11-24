import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useUserDoc } from '../../hooks/useUserDoc'

const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

const ITEMS = [
  {
    to: '/',
    label: 'dashboard',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
      </svg>
    ),
  },
  {
    to: '/focus',
    label: 'pomodoro',
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="13.5" r="7.5" />
        <path d="M12 10v3.5l2.5 1.5M9.5 2.5h5M12 2.5V6" />
      </svg>
    ),
  },
  {
    to: '/board',
    label: 'board',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="4" width="5" height="16" rx="1.5" />
        <rect x="10" y="4" width="5" height="10" rx="1.5" />
        <rect x="17" y="4" width="4" height="13" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/track',
    label: 'track',
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    to: '/money',
    label: 'money',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18M15.5 14.5h2.5" />
      </svg>
    ),
  },
  {
    to: '/review',
    label: 'review',
    icon: (
      <svg {...ICON}>
        <path d="M5 20V11M11 20V5M17 20v-7M3 20h18" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'settings',
    icon: (
      <svg {...ICON}>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </svg>
    ),
  },
]

const pad = (n: number) => String(n).padStart(2, '0')

export function Sidebar() {
  const { user } = useAuth()
  const { settings } = useUserDoc()
  const first = settings.name || user?.displayName?.split(' ')[0]?.toLowerCase() || 'friend'
  const initials = (user?.displayName ?? first)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const start = settings.dayStartHour
  const end = start === 0 ? '24:00' : `${pad(start)}:00`

  return (
    <aside className="flex flex-col gap-7 bg-bg-deep border-r-[1.5px] border-[#2E2A36] px-4 py-6 min-[900px]:w-[232px] min-[900px]:shrink-0">
      <div className="flex items-baseline gap-2 px-3">
        <span className="font-display text-[30px] font-extrabold tracking-[-0.04em] text-lime">mc.</span>
        <span className="font-mono text-[11px] text-muted">main character</span>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 min-h-[44px] px-3 rounded-xl text-sm font-semibold no-underline ${
                isActive ? 'bg-lime text-ink hover:text-ink' : 'text-muted hover:bg-surface hover:text-text'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="border-[1.5px] border-dashed border-line rounded-[14px] p-3 flex flex-col gap-1">
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">YOUR DAY</span>
          <span className="text-[13px] font-semibold">
            {pad(start)}:00 → {end} · 24h clock
          </span>
          <NavLink to="/settings" className="text-xs font-semibold">
            change day start
          </NavLink>
        </div>
        <div className="flex items-center gap-2.5 px-1">
          <span className="w-9 h-9 rounded-[11px] bg-startup text-ink flex items-center justify-center font-display font-extrabold text-sm -rotate-[5deg]">
            {initials || 'MC'}
          </span>
          <span className="text-sm font-semibold">{first}</span>
        </div>
      </div>
    </aside>
  )
}
