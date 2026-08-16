import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from './Tooltip'

export type TagTone = 'good' | 'info' | 'accent' | 'critical' | 'neutral'

interface TagProps {
  children: ReactNode
  tone?: TagTone
  icon?: LucideIcon
  /** Supplementary sentence. The chip's own label must stand without it. */
  tooltip?: string
  /** Off inside a clickable row: a focusable element in a button is invalid. */
  focusable?: boolean
}

/**
 * Tinted pill on a deliberately SHORT tone list. Measured, blue vs violet came
 * out at CVD ΔE 1.8 — and tags sit in a row, so every pair is adjacent, capping
 * usable hues at ~3. Colour encodes *class*, not identity; the icon and
 * uppercase label are what carry the rest.
 */
const TONES: Record<TagTone, string> = {
  good: 'bg-good/15 text-good',
  info: 'bg-info/15 text-info',
  accent: 'bg-accent/15 text-accent-ink',
  critical: 'bg-over/15 text-over',
  neutral: 'bg-ink/8 text-muted',
}

export function Tag({
  children,
  tone = 'neutral',
  icon: Icon,
  tooltip,
  focusable = false,
}: TagProps) {
  const pill = (
    <span
      className={`inline-flex cursor-default items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${TONES[tone]}`}
    >
      {Icon ? <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.5} /> : null}
      {children}
    </span>
  )

  if (!tooltip) return pill

  return (
    <Tooltip content={tooltip} openOnTap>
      <span
        tabIndex={focusable ? 0 : undefined}
        className="inline-flex rounded-full focus-visible:outline-2"
      >
        {pill}
      </span>
    </Tooltip>
  )
}
