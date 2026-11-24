import { useEffect, useState } from 'react'
import { dismissToast, subscribeToasts, type ToastMsg } from '../../lib/toast'

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  useEffect(() => subscribeToasts(setToasts), [])

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className="text-left bg-surface border-[1.5px] border-line-strong rounded-btn px-4 py-3 text-sm font-semibold text-text"
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
