import { useCallback, useSyncExternalStore } from 'react'

/**
 * Reach for this ONLY when the viewport changes *what renders*, not how it
 * looks — anything presentational belongs in a `sm:`/`lg:` variant, which costs
 * no JavaScript and cannot disagree with the CSS. `useSyncExternalStore`, so the
 * first render already has the right answer.
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
