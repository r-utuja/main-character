import { useUserDoc } from '../hooks/useUserDoc'
import { Placeholder } from './Placeholder'

export default function Dashboard() {
  const { settings } = useUserDoc()
  return <Placeholder title={`main character hours, ${settings.name}.`} blurb="your day at a glance lives here." phase={2} />
}
