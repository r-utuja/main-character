import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageShell } from './components/layout/PageShell'
import { Card } from './components/ui/Card'
import { ToastHost } from './components/ui/ToastHost'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { firebaseConfigured } from './lib/firebase'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Focus = lazy(() => import('./pages/Focus'))
const Board = lazy(() => import('./pages/Board'))
const Track = lazy(() => import('./pages/Track'))
const Money = lazy(() => import('./pages/Money'))
const Review = lazy(() => import('./pages/Review'))
const Settings = lazy(() => import('./pages/Settings'))

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="mc-dots min-h-screen flex items-center justify-center p-6">{children}</div>
}

function SetupNeeded() {
  return (
    <FullScreen>
      <Card className="max-w-[520px] flex flex-col gap-2">
        <h1 className="font-display text-[26px] font-extrabold m-0">almost there</h1>
        <p className="text-sm text-text-soft m-0">
          firebase isn&apos;t configured yet. copy <code className="font-mono">.env.example</code> to{' '}
          <code className="font-mono">.env.local</code>, fill in the four VITE_FIREBASE_* values, then restart the dev server.
        </p>
      </Card>
    </FullScreen>
  )
}

/** Signed-out visitors go to /login; the original path is kept so deep links still work after sign-in. */
function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <FullScreen>
        <span className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</span>
      </FullScreen>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <PageShell />
}

function Page({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<span className="font-mono text-xs text-muted tracking-[0.08em]">LOADING…</span>}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  if (!firebaseConfigured) return <SetupNeeded />
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGate />}>
            <Route index element={<Page><Dashboard /></Page>} />
            <Route path="focus" element={<Page><Focus /></Page>} />
            <Route path="board" element={<Page><Board /></Page>} />
            <Route path="track" element={<Page><Track /></Page>} />
            <Route path="money" element={<Page><Money /></Page>} />
            <Route path="review" element={<Page><Review /></Page>} />
            <Route path="settings" element={<Page><Settings /></Page>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastHost />
      </AuthProvider>
    </BrowserRouter>
  )
}
