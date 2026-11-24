import { Card } from '../components/ui/Card'

interface Props {
  title: string
  blurb: string
  phase: number
}

/** Phase 1 stand-in for pages that get built in later phases. */
export function Placeholder({ title, blurb, phase }: Props) {
  return (
    <>
      <h1 className="font-display text-[60px] font-extrabold leading-[0.92] tracking-[-0.04em] lowercase m-0">{title}</h1>
      <Card className="max-w-[560px] flex flex-col gap-2">
        <p className="text-[15px] font-semibold m-0">{blurb}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted m-0">coming in phase {phase}</p>
      </Card>
    </>
  )
}
