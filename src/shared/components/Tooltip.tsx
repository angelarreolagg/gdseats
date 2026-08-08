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
   * Open on tap where hover is unavailable.
   *
   * **Only for triggers that are decorative** — a chip whose whole job is to carry
   * this tooltip. It swallows the tap, so a trigger that also *does* something
   * must leave this off or its action stops firing: `AppHeader`'s logo is wrapped
   * in a tooltip and is the button that navigates home.
   */
  openOnTap?: boolean
}

/**
 * Radix wrapper carrying the project's tokens.
 *
 * Radix rather than a hand-rolled tooltip because of the accessibility ask: it
 * wires `aria-describedby`, opens on keyboard focus, closes on Escape, and
 * collision-flips near the viewport edge.
 *
 * IMPORTANT: a hover tooltip never fires on touch. `openOnTap` closes that gap for
 * decorative triggers, but the rule behind it has not moved — chips still carry
 * their own visible label, and the cost breakdown still repeats numbers
 * `MakeAnOfferCard` shows as rows. Tap is an enhancement, not a licence to put a
 * value here that exists nowhere else.
 *
 * **On touch the open state is fully controlled here, and Radix is given no
 * `onOpenChange`.** That is deliberate. Radix closes a tooltip on the trigger's
 * `pointerdown`, which lands before the `click` that would toggle it — so with
 * Radix sharing the state, a second tap reads as close-then-open and the tooltip
 * can never be dismissed by tapping the thing that opened it. Owning the state
 * outright is the only version where both taps behave.
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
