import { ConciergeSection } from './ConciergeSection'
import { FaqSection } from './FaqSection'
import { SellCtaSection } from './SellCtaSection'
import { TheGDWaySection } from './TheGDWaySection'

/**
 * Everything below the team grid on the landing screen, in order.
 *
 * One component rather than four imports in `App`, because the order is the
 * argument: reassure (the three pillars), offer a way to be helped without
 * browsing (the concierge), ask for the sell side (the CTA), then answer what
 * is left (the FAQ). Shuffling them is a product decision, and it should take
 * editing a file named for that job rather than editing the shell.
 *
 * Vertical rhythm is owned here in the sense that each band carries its own
 * `py-16 sm:py-20` — the CTA is a full-bleed slab and cannot take a margin
 * without a gap opening beside it, so padding is the only lever that keeps the
 * spacing even across all four.
 */
export function LandingSections() {
  return (
    <>
      <TheGDWaySection />
      <ConciergeSection />
      <SellCtaSection />
      <FaqSection />
    </>
  )
}
