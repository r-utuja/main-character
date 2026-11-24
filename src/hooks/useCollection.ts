import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, type QueryConstraint } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'

/**
 * Live list from users/{uid}/{name}. Each item gets its document id as `id`.
 * `key` must change whenever the constraints change (constraints are objects, so we can't compare them).
 */
export function useCollection<T>(
  name: string,
  constraints: QueryConstraint[] = [],
  key = '',
): { items: (T & { id: string })[]; loading: boolean } {
  const { user } = useAuth()
  const uid = user?.uid
  const [state, setState] = useState<{ id: string; items: (T & { id: string })[] } | null>(null)
  const sig = `${uid}/${name}/${key}`

  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      query(collection(db, 'users', uid, name), ...constraints),
      (snap) => {
        setState({ id: sig, items: snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })) })
      },
      (err) => {
        console.error(err)
        setState({ id: sig, items: [] })
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, name, key])

  const ready = state?.id === sig
  return { items: ready ? state.items : [], loading: !ready }
}
