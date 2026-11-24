import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth'
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { auth, db, firebaseConfigured, googleProvider } from '../lib/firebase'
import { STARTER_HABITS, defaultUserDoc } from '../lib/defaults'
import { safeWrite } from '../lib/write'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

/** First sign-in: create users/{uid} with defaults plus the 5 starter habits. */
async function ensureUserDoc(user: User) {
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)
  if (snap.exists()) return
  const batch = writeBatch(db)
  const name = user.displayName?.split(' ')[0]?.toLowerCase() || 'friend'
  batch.set(userRef, defaultUserDoc(name, user.email ?? ''))
  for (const habit of STARTER_HABITS) {
    batch.set(doc(collection(db, 'users', user.uid, 'habits')), habit)
  }
  await batch.commit()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(firebaseConfigured)

  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      setLoading(false)
      if (next) void safeWrite(() => ensureUserDoc(next), "couldn't set up your workspace. check your connection.")
    })
  }, [])

  const signIn = async () => {
    await safeWrite(() => signInWithPopup(auth, googleProvider), "sign-in didn't finish. try again?")
  }
  const signOut = async () => {
    await safeWrite(() => fbSignOut(auth), "couldn't sign out. try again?")
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
