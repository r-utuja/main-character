// Tiny pub-sub so any code can show a toast without context plumbing.
export interface ToastMsg {
  id: number
  text: string
}

type Listener = (toasts: ToastMsg[]) => void

let toasts: ToastMsg[] = []
let nextId = 1
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l(toasts))
}

export function toast(text: string) {
  const id = nextId++
  toasts = [...toasts, { id, text }]
  emit()
  setTimeout(() => dismissToast(id), 4000)
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener(toasts)
  return () => {
    listeners.delete(listener)
  }
}
