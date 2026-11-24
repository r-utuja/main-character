import { Link } from 'react-router-dom'
import { Sticker } from '../ui/Sticker'
import { hourLabel } from '../../lib/dates'
import type { PlanBlock } from '../../lib/metrics'
import type { Big3Task } from '../../types'

interface Props {
  block: PlanBlock | undefined
  nowHour: number
  mvd: boolean
  /** Task chosen by "what now?" (first unfinished, frog first), if the user pressed it. */
  whatNow: Big3Task | null
  frog: Big3Task | undefined
  onWhatNow: () => void
  onPlanThisHour: () => void
}

export function RightNow({ block, nowHour, mvd, whatNow, frog, onWhatNow, onPlanThisHour }: Props) {
  const range = block ? `${hourLabel(block.hours[0])}:00 – ${hourLabel((block.hours[block.hours.length - 1] + 1) % 24)}:00` : ''
  const blockTitle = block ? block.label || block.cat : ''
  const focusTask = whatNow ?? (block ? frog && frog.cat === block.cat ? frog : undefined : undefined)

  let title: string
  if (whatNow) title = whatNow.title
  else if (!block) title = 'nothing planned right now'
  else if (mvd && frog) title = `just 1 pomodoro of ${frog.title}`
  else title = blockTitle

  const lockInTo = focusTask ? `/focus?task=${focusTask.id}` : '/focus'

  return (
    <section className="relative bg-lime text-ink rounded-[24px] px-[22px] pt-[30px] pb-[22px] shadow-[6px_6px_0_#B8A6FF] mt-2 flex flex-col gap-3">
      <Sticker overlap rotate={-4}>
        RIGHT NOW
      </Sticker>
      <span className="font-mono text-xs font-semibold">
        {block ? `${range} · ${block.cat}${block.label ? ' ' + block.label : ''}` : `${hourLabel(nowHour)}:00 · open hour`}
      </span>
      <h2 className="m-0 font-display text-[34px] leading-[0.95] font-extrabold tracking-[-0.03em]">{title}</h2>
      {block?.ifThen && !whatNow && (
        <div className="flex flex-col gap-[3px] border-[1.5px] border-dashed border-ink rounded-xl px-3 py-2.5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.06em]">YOUR IF-THEN</span>
          <span className="text-sm font-medium leading-[1.35]">{block.ifThen}</span>
        </div>
      )}
      <div className="flex gap-2.5">
        {block || whatNow ? (
          <>
            <Link
              to={lockInTo}
              className="flex-1 min-h-[50px] rounded-btn bg-ink text-lime flex items-center justify-center gap-2 font-bold text-[15px] no-underline hover:text-lime"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="#CDF56A">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
              lock in with a pomodoro
            </Link>
            <button
              type="button"
              onClick={onWhatNow}
              className="min-h-[50px] px-4 rounded-btn bg-transparent border-2 border-ink text-ink font-bold text-sm"
            >
              what now?
            </button>
          </>
        ) : (
          <button type="button" onClick={onPlanThisHour} className="flex-1 min-h-[50px] rounded-btn bg-ink text-lime font-bold text-[15px] border-0">
            plan this hour
          </button>
        )}
      </div>
    </section>
  )
}
