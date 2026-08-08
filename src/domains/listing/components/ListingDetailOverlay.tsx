import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import {
  ChartColumn,
  ChevronLeft,
  History,
  MapPin,
  Share2,
  type LucideIcon,
} from 'lucide-react'
import { showDemoNotice } from '@/shared/utils/demoNotice'
import { AIInsightPanel } from '@/domains/deal-analyzer/components/AIInsightPanel'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '../types/listing.types'
import { toListingSignals } from '../services/listingSignals.service'
import { SeatMap } from './SeatMap'
import { ListingSummaryCard } from './ListingSummaryCard'
import { MakeAnOfferCard } from './MakeAnOfferCard'
import { PriceHistoryTable } from './PriceHistoryTable'
import { PriceStatsChart } from './PriceStatsChart'

interface ListingDetailOverlayProps {
  listing: Listing
  team: Team
  sectionListings: Listing[]
  onClose: () => void
}

function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 border-b border-border-hairline pb-3 text-sm font-semibold text-ink">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
      {children}
    </h2>
  )
}

export function ListingDetailOverlay({
  listing,
  team,
  sectionListings,
  onClose,
}: ListingDetailOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Stable identity so the panel's analysis timer keys off the listing, not off a
  // fresh object arriving with every render.
  const signals = useMemo(() => toListingSignals(listing), [listing])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    // preventScroll matters: the panel is taller than the viewport, so a plain
    // focus() scrolls it into view and eats the top margin — the dialog opens
    // already clipped against the top edge until the user scrolls back up.
    panelRef.current?.focus({ preventScroll: true })

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // The page behind must not scroll while the dialog is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
        aria-hidden="true"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Listing ${listing.id}, section ${listing.section}`}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto my-6 w-[min(1040px,calc(100%-2rem))] rounded-2xl border border-border-hairline bg-page shadow-hero outline-none"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border-hairline px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-border-hairline px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-track"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Back to search
          </button>

          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
            <span className="text-xs font-semibold tracking-widest text-muted uppercase">
              G&amp;D Seats
            </span>
          </div>

          <button
            type="button"
            onClick={showDemoNotice}
            className="inline-flex items-center gap-2 rounded-lg border border-border-hairline px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-track"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            Share
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
          <div className="flex flex-col gap-8">
            <section>
              <SectionHeading icon={MapPin}>Location</SectionHeading>
              <SeatMap
                className="h-64 w-full"
                selectedSection={listing.section}
                readOnly
                showLabels={false}
              />
            </section>

            {/* Directly under the map: the verdict belongs with understanding the
                seat, not in the middle of the offer flow on the right. */}
            <AIInsightPanel signals={signals} />

            <section>
              <SectionHeading icon={History}>Price history</SectionHeading>
              <PriceHistoryTable history={listing.priceHistory} />
            </section>

            <section>
              <SectionHeading icon={ChartColumn}>Price stats</SectionHeading>
              <PriceStatsChart sectionListings={sectionListings} listing={listing} />
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <ListingSummaryCard listing={listing} team={team} />
            <MakeAnOfferCard listing={listing} />
          </aside>
        </div>
      </motion.div>
    </div>
  )
}
