import { useEffect, useState } from 'react'

/** Current time, refreshed every intervalMs (once a minute by default; once a second only on /focus while running). */
export function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
