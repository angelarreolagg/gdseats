import { useCallback, useSyncExternalStore } from 'react'

/**
 * Read a CSS media query from React.
 *
 * Reach for this ONLY when the viewport has to change what renders, not how it
 * looks. Anything that is purely presentational — a width, a gap, whether a label
 * is visible — belongs in a Tailwind `sm:` / `lg:` variant, which costs no
 * JavaScript, never disagrees with the CSS, and cannot flash the wrong branch.
 *
 * The one case in this app that genuinely needs it is `ListingDetailOverlay`:
 * below `lg` the offer form moves into a bottom sheet, and it must exist in
 * exactly ONE place. Rendering it twice and hiding one copy with CSS would put
 * duplicate element ids and two identically-labelled forms in the document, and
 * the hidden one would still be in the tab order. `inert` fixes the tab order but
 * is an attribute rather than a property, so it cannot be scoped to a breakpoint
 * without JavaScript either. That leaves a render-time branch.
 *
 * Built on `useSyncExternalStore` for the same reason `useIsDarkTheme` is: it
 * subscribes without an effect, so the first render already has the right answer
 * and there is no frame where the wrong branch is on screen.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof matchMedia !== 'function') return () => {}

      const list = matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    if (typeof matchMedia !== 'function') return false
    return matchMedia(query).matches
  }, [query])

  // No DOM to measure during prerender. `false` means every query reads as
  // unmatched, so a `min-width` check falls to its narrow branch — the safer
  // default, since a compact layout is legible at any width and the reverse is
  // not.
  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
