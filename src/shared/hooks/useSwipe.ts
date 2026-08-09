import { useCallback, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

/** Horizontal travel, in px, before a drag counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 48

/**
 * How much more horizontal than vertical the travel has to be.
 *
 * A phone's dominant gesture on a page like this is scrolling, and a scroll
 * almost never leaves the finger perfectly vertical. Requiring the sideways
 * component to clearly win is what keeps a slightly slanted scroll from paging
 * the grid out from under the reader.
 */
const DIRECTION_RATIO = 1.5

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

/**
 * Horizontal swipe-to-page, as props to spread onto the surface being swiped.
 *
 * Touch only, by design. A mouse drag across a grid is a text selection or a
 * nudge, not a page turn, and claiming it would make the desktop pointer feel
 * possessed — `pointerType === 'mouse'` is ignored outright. The gesture is
 * always an *enhancement*: whatever it drives must stay reachable by a control
 * that works with a keyboard and a screen reader.
 *
 * Nothing here calls `preventDefault` on the pointer stream, so vertical
 * scrolling is untouched — the browser keeps the scroll and simply hands us a
 * `pointercancel` when it takes over.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight }: UseSwipeOptions) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse') return
    start.current = { x: event.clientX, y: event.clientY }
    // Cleared here as well as on use, so a swipe that never produced a click
    // cannot leave the suppressor armed for the next unrelated tap.
    swiped.current = false
  }, [])

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const from = start.current
      start.current = null
      if (!from) return

      const dx = event.clientX - from.x
      const dy = event.clientY - from.y
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return

      swiped.current = true
      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    },
    [onSwipeLeft, onSwipeRight],
  )

  const onPointerCancel = useCallback(() => {
    start.current = null
  }, [])

  /**
   * A swipe that starts on a card still ends in a `click` on that card, which
   * would open the team the buyer was only sliding past. Swallowed in the
   * capture phase so the child's own handler never runs — by the bubble phase it
   * is already too late.
   */
  const onClickCapture = useCallback((event: ReactMouseEvent) => {
    if (!swiped.current) return
    swiped.current = false
    event.preventDefault()
    event.stopPropagation()
  }, [])

  return { onPointerDown, onPointerUp, onPointerCancel, onClickCapture }
}
