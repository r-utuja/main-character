import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { defaultUserDoc } from '../lib/defaults'
import type { UserDoc } from '../types'
import { useAuth } from './useAuth'

/** Live user settings. A missing doc falls back to defaults, so pages never see undefined. */
export function useUserDoc(): { settings: UserDoc; loading: boolean } {
  const { user } = useAuth()
  const [stored, setStored] = useState<Partial<UserDoc> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setStored(snap.exists() ? (snap.data() as Partial<UserDoc>) : null)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      },
    )
  }, [user])

  const base = defaultUserDoc(user?.displayName?.split(' ')[0]?.toLowerCase() ?? 'friend', user?.email ?? '')
  return { settings: { ...base, ...stored }, loading }
}
