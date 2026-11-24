import { useState } from 'react'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Modal } from '../ui/Modal'
import { SLOT_CATS } from '../../lib/defaults'
import { hourLabel, hourOrder } from '../../lib/dates'
import type { Slot, SlotCat } from '../../types'

interface Props {
  kind: 'plan' | 'actual'
  hour: number
  current?: Slot
  dayStartHour: number
  onSave: (entries: Record<string, Slot | null>) => void
  onClose: () => void
}

/** Popover-style editor for one slot. Planned and actual slots edit the same way. */
export function SlotEditor({ kind, hour, current, dayStartHour, onSave, onClose }: Props) {
  const [cat, setCat] = useState<SlotCat | null>(current?.cat ?? null)
  const [label, setLabel] = useState(current?.label ?? '')
  const [ifThen, setIfThen] = useState(current?.ifThen ?? '')
  const [count, setCount] = useState(1)

  const order = hourOrder(dayStartHour)
  const pos = order.indexOf(hour)
  const maxCount = 24 - pos
  const targets = order.slice(pos, pos + Math.min(count, maxCount))

  const save = () => {
    if (!cat) return
    const slot: Slot = { cat }
    if (label.trim()) slot.label = label.trim()
    if (kind === 'plan' && ifThen.trim()) slot.ifThen = ifThen.trim()
    onSave(Object.fromEntries(targets.map((h) => [String(h), slot])))
    onClose()
  }
  const clear = () => {
    onSave(Object.fromEntries(targets.map((h) => [String(h), null])))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`${kind} ${hourLabel(hour)}:00`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <h2 className="font-display text-[22px] font-extrabold m-0">
          {kind === 'plan' ? 'plan' : 'what happened'} · {hourLabel(hour)}:00
        </h2>
        <div className="flex flex-wrap gap-2">
          {SLOT_CATS.map((c) => (
            <Chip key={c} cat={c} selected={cat === c} onClick={() => setCat(c)} aria-pressed={cat === c}>
              {c}
            </Chip>
          ))}
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="label (optional)"
          aria-label="label"
          className="min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text"
        />
        {kind === 'plan' && (
          <input
            value={ifThen}
            onChange={(e) => setIfThen(e.target.value)}
            placeholder="if it's this hour → notes open, phone away"
            aria-label="if-then"
            className="min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-3 text-sm text-text"
          />
        )}
        <label className="flex items-center gap-3 text-sm text-text-soft">
          apply to next
          <input
            type="number"
            min={1}
            max={maxCount}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)))}
            className="w-16 min-h-[44px] rounded-btn bg-surface-2 border-[1.5px] border-line-strong px-2 text-sm text-text font-mono"
          />
          hours
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!cat}>
            save
          </Button>
          {current && (
            <Button variant="ghost" onClick={clear}>
              clear
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
