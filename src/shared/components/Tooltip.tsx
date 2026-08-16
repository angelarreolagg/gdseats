import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { useMediaQuery } from '../hooks/useMediaQuery'

/** A device whose primary pointer cannot hover — where a hover tooltip is dead. */
const TOUCH_QUERY = '(hover: none)'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Structured content (a breakdown table) needs padding the text variant doesn't. */
  variant?: 'text' | 'panel'
  /**
   * Opt-in, and must stay that way: it swallows the tap, so a trigger that also
   * does something loses its action.
   */
  openOnTap?: boolean
}

/**
 * Radix wrapper carrying the project's tokens.
 *
 * On touch the open state is fully controlled and Radix gets no `onOpenChange`:
 * it closes on the trigger's `pointerdown`, which lands before the `click` that
 * would toggle it, so a shared state can never be dismissed by tapping what
 * opened it. Dismissal is a document listener that ignores the trigger, or the
 * outside-tap close and the click-toggle cancel out.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  variant = 'text',
  openOnTap = false,
}: TooltipProps) {
  const isTouch = useMediaQuery(TOUCH_QUERY)
  const tapEnabled = openOnTap && isTouch
  const [tappedOpen, setTappedOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!tapEnabled || !tappedOpen) return

    // Dismissal, hand-rolled for the same reason the open state is: Radix is not
    // managing this tooltip. A tap on the trigger is ignored here and left to the
    // click handler below, or the two would fight and cancel out.
    function onPointerDown(event: PointerEvent) {
      if (triggerRef.current?.contains(event.target as Node)) return
      setTappedOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setTappedOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [tapEnabled, tappedOpen])

  return (
    <RadixTooltip.Root open={tapEnabled ? tappedOpen : undefined}>
      <RadixTooltip.Trigger
        asChild
        ref={triggerRef}
        onClick={
          tapEnabled
            ? (event) => {
                // The chip sits inside `TeamCard`'s and `ListingRow`'s <button>.
                // Without this, reading the forecast also opens the team.
                event.preventDefault()
                event.stopPropagation()
                setTappedOpen((open) => !open)
              }
            : undefined
        }
      >
        {children}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={12}
          // max-w is not optional: without it a long tooltip lays out as a single
          // line and can span the whole viewport — a two-sentence one stretched
          // across three cards before this was added.
          className={`z-[60] max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border-hairline bg-surface text-ink shadow-raised will-change-[transform,opacity] data-[state=delayed-open]:animate-in ${
            variant === 'panel' ? 'p-3' : 'px-2.5 py-1.5 text-xs leading-relaxed font-medium'
          }`}
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--psl-surface)]" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
