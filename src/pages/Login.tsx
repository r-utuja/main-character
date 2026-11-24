import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Sticker } from '../components/ui/Sticker'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { user, loading, signIn } = useAuth()
  if (user) return <Navigate to="/" replace />

  return (
    <div className="mc-dots min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px] flex flex-col gap-8">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[30px] font-extrabold tracking-[-0.04em] text-lime">mc.</span>
          <span className="font-mono text-[11px] text-muted">main character</span>
        </div>
        <h1 className="font-display text-[60px] font-extrabold leading-[0.92] tracking-[-0.04em] lowercase m-0">
          be the main character.
        </h1>
        <Card hero className="flex flex-col gap-4 mt-2" style={{ boxShadow: '6px 6px 0 #CDF56A' }}>
          <Sticker overlap rotate={-4} bg="#121016" fg="#CDF56A">
            WELCOME
          </Sticker>
          <p className="text-[15px] text-text-soft m-0 pt-1">
            plan the day, track every hour, lock in. your data is private to your google account. no judgement here.
          </p>
          <Button onClick={() => void signIn()} disabled={loading}>
            continue with google
          </Button>
        </Card>
      </div>
    </div>
  )
}
