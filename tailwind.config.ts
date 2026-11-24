import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#121016',
        'bg-deep': '#100E14',
        surface: '#1D1A23',
        'surface-2': '#2A2631',
        line: '#3B3546',
        'line-strong': '#4A4356',
        text: '#F3EFE7',
        'text-soft': '#D9D3E2',
        muted: '#ABA3B8',
        lime: '#CDF56A',
        ink: '#121016',
        college: '#B8A6FF',
        placement: '#86CBFF',
        exploration: '#FF8FB8',
        startup: '#FFA36C',
        other: '#8F87A0',
        sleep: '#2A2631',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Arial Narrow"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '20px', hero: '26px', btn: '14px' },
      boxShadow: {
        'hard-lilac': '4px 4px 0 #B8A6FF',
        'hard-lime': '6px 6px 0 #CDF56A',
      },
    },
  },
  plugins: [],
} satisfies Config
