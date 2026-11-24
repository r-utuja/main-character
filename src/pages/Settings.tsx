import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { Placeholder } from './Placeholder'

export default function Settings() {
  const { signOut } = useAuth()
  return (
    <>
      <Placeholder title="settings" blurb="day start, habits, budgets and more." phase={7} />
      <div>
        <Button variant="ghost" onClick={() => void signOut()}>
          sign out
        </Button>
      </div>
    </>
  )
}
