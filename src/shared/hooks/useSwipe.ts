import { useCallback, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

/** Horizontal travel, in px, before a drag counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 48

/**
 * Scrolling is what a finger does here nearly every time, and a scroll is rarely
 * straight — without the ratio a slanted scroll pages the catalogue away.
 */
const DIRECTION_RATIO = 1.5

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

/**
 * Horizontal swipe-to-page, spread onto the surface being swiped.
 *
 * Mouse pointers are ignored — a mouse drag across a grid is a text selection.
 * The trailing `click` is swallowed in the capture phase, or every swipe also
 * opens the card the finger came down on; the flag disarms on use and on the
 * next `pointerdown`. Nothing calls `preventDefault`, so scrolling is untouched.
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
