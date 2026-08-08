import { useSyncExternalStore } from 'react'

/**
 * Read-only companion to `useTheme`.
 *
 * `useTheme` *sets* the theme: every instance runs an effect that writes
 * localStorage and toggles the root class. That is safe with exactly one
 * consumer (ThemeToggle) and unsafe with many — eight team cards calling it
 * would be eight writers of the same global.
 *
 * This one only reads. One module-level MutationObserver serves every
 * subscriber, so components can ask "is it dark?" as freely as they like.
 */

function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined') return () => {}

  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains('dark')
}

/** Server/prerender has no DOM; the light palette is the documented default. */
function getServerSnapshot(): boolean {
  return false
}

export function useIsDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
