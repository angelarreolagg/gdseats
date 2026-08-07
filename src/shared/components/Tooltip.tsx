import type { ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Structured content (a breakdown table) needs padding the text variant doesn't. */
  variant?: 'text' | 'panel'
}

/**
 * Radix wrapper carrying the project's tokens.
 *
 * Radix rather than a hand-rolled tooltip because of the accessibility ask: it
 * wires `aria-describedby`, opens on keyboard focus, closes on Escape, and
 * collision-flips near the viewport edge.
 *
 * IMPORTANT: hover tooltips never fire on touch. Everything here is supplementary
 * — chips carry their own visible label, and the cost breakdown repeats numbers
 * that `MakeAnOfferCard` already shows as visible rows. Never put a value here
 * that exists nowhere else.
 */
export function Tooltip({ content, children, side = 'top', variant = 'text' }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={`z-[60] rounded-lg border border-border-hairline bg-surface text-ink shadow-raised will-change-[transform,opacity] data-[state=delayed-open]:animate-in ${
            variant === 'panel' ? 'p-3' : 'px-2.5 py-1.5 text-xs font-medium'
          }`}
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--psl-surface)]" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
