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
  /**
   * Give the chip its own tab stop. Off inside a clickable row — a focusable
   * element nested in a button is invalid and would add a tab stop per chip
   * across every row. The detail card turns it on, so the copy stays reachable
   * by keyboard somewhere.
   */
  focusable?: boolean
}

/**
 * Tinted pill, deliberately on a SHORT list of tones.
 *
 * The reference UI gives every amenity its own hue (blue, purple, maroon, teal).
 * Measured, that does not survive: blue vs violet come out at CVD ΔE 1.8 and 10.1
 * even in normal vision — below the floor, so those two tags are indistinguishable
 * side by side. Tags sit in a row, which makes every pair adjacent, and that caps
 * the usable hue count at about three.
 *
 * So colour here encodes *class*, not identity: promoted (accent), time-critical
 * (info), price signal (good/critical), and everything else neutral — amenity
 * names are already carried by their own text. Green vs red still collapses under
 * deuteranopia (ΔE 1.2 in light mode), which is why every tag ships an icon and an
 * uppercase label; the pairing is the mitigation, exactly as in StatusBadge.
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
