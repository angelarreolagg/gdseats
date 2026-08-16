import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/shared/components/IconButton'
import type { Listing } from '../types/listing.types'
import { MakeAnOfferCard } from './MakeAnOfferCard'

interface OfferSheetProps {
  listing: Listing
  open: boolean
  onClose: () => void
}

/** Past this much drag, or this fast a flick, the gesture reads as a dismissal. */
const DISMISS_OFFSET = 120
const DISMISS_VELOCITY = 500

/**
 * The offer form as a bottom sheet, for viewports too narrow for the aside.
 *
 * **Must not render inside the overlay's animated panel**: that panel has a `y`
 * transform, and a transformed ancestor becomes the containing block for fixed
 * descendants — the sheet would scroll away with the page.
 *
 * Four ways out. Drag has no keyboard equivalent and no name, so the handle is
 * `aria-hidden` and the button, backdrop and Escape are the real exits. Escape
 * is handled by `ListingDetailOverlay`, which has to win the precedence.
 */
export function OfferSheet({ listing, open, onClose }: OfferSheetProps) {
  const { t } = useTranslation('listing')
  const titleId = useId()

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-20 bg-black/50"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            // Elastic downward only: the sheet is already at the bottom, so an upward
            // rubber-band would peel it off the edge.
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_event, info) => {
              if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
                onClose()
              }
            }}
            // `overscroll-contain`, or a flick at the end scrolls the listing behind it.
            className="fixed inset-x-0 bottom-0 z-30 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border-hairline bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] shadow-hero"
          >
            <div className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
              <span aria-hidden="true" className="h-1 w-10 rounded-full bg-muted/40" />
            </div>

            <header className="flex items-center justify-between gap-4 border-b border-border-hairline px-4 pb-3">
              <h2 id={titleId} className="text-base font-semibold text-ink">
                {t('offer.heading')}
              </h2>
              {/* `md` (40px), not `sm` — this is a touch-only surface. */}
              <IconButton label={t('offer.close')} onClick={onClose}>
                <X aria-hidden="true" className="h-4 w-4" />
              </IconButton>
            </header>

            {/* Borderless and shadowless — the sheet is already the surface. */}
            <MakeAnOfferCard
              listing={listing}
              showHeading={false}
              onAfterSubmit={onClose}
              className="px-4 pt-4"
            />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
