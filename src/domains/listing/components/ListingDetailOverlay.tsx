import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ChartColumn,
  ChevronLeft,
  History,
  MapPin,
  Share2,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { SITE_NAME } from '@/shared/config/site'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { showDemoNotice } from '@/shared/utils/demoNotice'
import { AIInsightPanel } from '@/domains/deal-analyzer/components/AIInsightPanel'
import type { Team } from '@/domains/teams/types/team.types'
import type { Listing } from '../types/listing.types'
import { toListingSignals } from '../services/listingSignals.service'
import { SeatMap } from './SeatMap'
import { ListingSummaryCard } from './ListingSummaryCard'
import { MakeAnOfferCard } from './MakeAnOfferCard'
import { OfferSheet } from './OfferSheet'
import { PriceHistoryTable } from './PriceHistoryTable'
import { PriceStatsChart } from './PriceStatsChart'

/**
 * Where the offer form stops fitting beside the listing and moves into a sheet.
 *
 * Matches the `lg:` grid below, and the two must move together — this is the one
 * breakpoint in the app that JavaScript and CSS both have to agree on.
 */
const ASIDE_QUERY = '(min-width: 1024px)'

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
  const { t } = useTranslation('listing')
  const panelRef = useRef<HTMLDivElement>(null)
  const hasAside = useMediaQuery(ASIDE_QUERY)
  const [offerOpen, setOfferOpen] = useState(false)
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
      if (event.key !== 'Escape') return

      // Innermost dialog first. Both this overlay and the offer sheet listen for
      // Escape, and without the precedence the key would close the whole listing
      // out from under someone who only meant to dismiss the sheet — losing their
      // place in a list of ~170 rows to a keystroke that should have cost nothing.
      if (offerOpen) {
        setOfferOpen(false)
        return
      }
      onClose()
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
  }, [onClose, offerOpen])

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
        aria-label={t('detail.dialogLabel', { id: listing.id, section: listing.section })}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        /*
         * Full-bleed below `sm`, the inset card from `sm` up.
         *
         * `min-h-dvh`, not `h-dvh`: the content is taller than the viewport and
         * has to keep scrolling inside the wrapper above.
         */
        className="relative mx-auto min-h-dvh w-full bg-page outline-none sm:my-6 sm:min-h-0 sm:w-[min(1040px,calc(100%-2rem))] sm:rounded-2xl sm:border sm:border-border-hairline sm:shadow-hero"
      >
        {/*
         * Sticky, because the panel is four screens tall on a phone and the way
         * out should not require scrolling back to find it.
         *
         * Back and Share keep their `aria-label` at every width while the visible
         * text appears only from `sm`. Icon-only below that — three full-text
         * controls in one row is what crushed this header at 390px — but an icon
         * button with no name is unusable to a screen reader, so the label is the
         * permanent one and the text is the enhancement.
         */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-hairline bg-page/95 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('detail.backToSearch')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border-hairline px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-track sm:px-3"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">{t('detail.backToSearch')}</span>
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
            <span className="text-xs font-semibold tracking-widest whitespace-nowrap text-muted uppercase">
              {SITE_NAME}
            </span>
          </div>

          <button
            type="button"
            onClick={showDemoNotice}
            aria-label={t('detail.share')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border-hairline px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-track sm:px-3"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">{t('detail.share')}</span>
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
          <div className="flex flex-col gap-8">
            <section>
              <SectionHeading icon={MapPin}>{t('detail.location')}</SectionHeading>
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
              <SectionHeading icon={History}>{t('detail.priceHistory')}</SectionHeading>
              <PriceHistoryTable history={listing.priceHistory} />
            </section>

            <section>
              <SectionHeading icon={ChartColumn}>{t('detail.priceStats')}</SectionHeading>
              <PriceStatsChart sectionListings={sectionListings} listing={listing} />
            </section>
          </div>

          {/*
           * The offer form exists in exactly ONE place, which is why this is a
           * render-time branch and not a `lg:hidden` pair. Two copies would mean
           * two elements with `id="offer-amount"`, two identically-labelled forms
           * announced to a screen reader, and a hidden one still in the tab order.
           */}
          <aside className="flex flex-col gap-4">
            <ListingSummaryCard listing={listing} team={team} />
            {hasAside ? <MakeAnOfferCard listing={listing} /> : null}
          </aside>
        </div>

        {hasAside ? null : (
          /*
           * `sticky`, not `fixed`, and that is load-bearing: this panel is a
           * `motion.div` animating `y`, and a transformed ancestor becomes the
           * containing block for `position: fixed` children — a fixed bar would
           * anchor to the panel and scroll away with it.
           *
           * The padding clears the iPhone home indicator, which otherwise sits on
           * top of the button.
           */
          <div className="sticky bottom-0 z-10 border-t border-border-hairline bg-page/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
            <Button type="button" fullWidth onClick={() => setOfferOpen(true)}>
              {t('detail.makeAnOffer')}
            </Button>
          </div>
        )}
      </motion.div>

      {/*
       * Outside the panel on purpose — see the note in OfferSheet. The panel's
       * transform would capture a `position: fixed` sheet and pin it to the panel
       * instead of the viewport.
       *
       * Not rendered at all once the aside exists, rather than merely closed: a
       * window dragged wider mid-offer would otherwise hold an open sheet and a
       * new inline form at the same time, and both own `id="offer-amount"`.
       */}
      {hasAside ? null : (
        <OfferSheet listing={listing} open={offerOpen} onClose={() => setOfferOpen(false)} />
      )}
    </div>
  )
}
