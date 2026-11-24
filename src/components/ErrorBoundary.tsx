import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface Props {
  children: ReactNode
}

/** One per page. The sidebar lives outside it, so navigation keeps working. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Card className="flex flex-col items-start gap-3">
        <h2 className="font-display text-[22px] font-extrabold">something broke on this page</h2>
        <p className="text-sm text-text-soft">your data is safe. a reload usually fixes it.</p>
        <Button onClick={() => window.location.reload()}>reload</Button>
      </Card>
    )
  }
}
