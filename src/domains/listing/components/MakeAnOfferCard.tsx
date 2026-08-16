import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { formatCurrency, parseCurrencyInput } from '@/shared/utils/formatters'
import { showOfferNotice } from '@/shared/utils/demoNotice'
import type { Listing } from '../types/listing.types'
import { getTotalPrice } from '../types/listing.types'

interface MakeAnOfferCardProps {
  listing: Listing
  /**
   * Off inside `OfferSheet`, which supplies its own titled header.
   *
   * Two "Make an offer" headings in one dialog is a duplicate landmark to a
   * screen reader, and it would make `getByRole('heading', { name: /make an
   * offer/i })` match twice.
   */
  showHeading?: boolean
  /** Lets the sheet close itself once the notice is up. */
  onAfterSubmit?: () => void
  className?: string
}

/** How many digits sit before this offset — the caret's position in digit-space. */
function countDigits(value: string, upTo: number): number {
  return (value.slice(0, upTo).match(/\d/g) ?? []).length
}

/** The inverse: where to put the caret so that `n` digits sit behind it. */
function offsetAfterDigits(value: string, n: number): number {
  if (n <= 0) return value.length && !/\d/.test(value[0]) ? 1 : 0

  let seen = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seen += 1
      if (seen === n) return index + 1
    }
  }
  return value.length
}

function FeeRow({ label, value, emphasis = false }: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-hairline py-2.5">
      <span className={`text-sm ${emphasis ? 'font-medium text-ink' : 'text-muted'}`}>
        {label}
      </span>
      <span
        className={`text-sm font-medium tabular-nums ${emphasis ? 'text-accent-ink' : 'text-ink'}`}
      >
        {value}
      </span>
    </div>
  )
}

export function MakeAnOfferCard({
  listing,
  showHeading = true,
  onAfterSubmit,
  className = 'rounded-xl border border-border-hairline bg-surface p-4 shadow-card',
}: MakeAnOfferCardProps) {
  const { t } = useTranslation('listing')
  // Held as the formatted string so the field can show "$23,550" and still be
  // cleared. `type="number"` cannot render a currency symbol or separators at
  // all, which is why this is a text field doing its own formatting.
  const [offer, setOffer] = useState(() => formatCurrency(getTotalPrice(listing)))
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)

  const amount = parseCurrencyInput(offer)
  const total = amount + listing.transferFee + listing.platformFee

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    const digits = raw.replace(/\D/g, '')

    // Remember the caret in digit-space, not character-space: reformatting adds
    // and removes separators, so a raw offset would drift every time a comma
    // appears and the caret would jump to the end mid-edit.
    pendingCaret.current = countDigits(raw, event.target.selectionStart ?? raw.length)
    setOffer(digits ? formatCurrency(Number(digits)) : '')
  }

  useLayoutEffect(() => {
    const caret = pendingCaret.current
    const input = inputRef.current
    if (caret === null || !input) return

    const position = offsetAfterDigits(input.value, caret)
    input.setSelectionRange(position, position)
    pendingCaret.current = null
  }, [offer])

  return (
    <section className={className}>
      {showHeading ? (
        <h2 className="mb-3 text-sm font-semibold text-ink">
          {t('offer.heading')} <span className="text-over">*</span>
        </h2>
      ) : null}

      <label className="sr-only" htmlFor="offer-amount">
        {t('offer.amountLabel')}
      </label>
      {/*
       * `text-base` below `sm`, not `text-sm`. iOS Safari zooms the whole viewport
       * when a field under 16px takes focus, and it does not zoom back out — the
       * page is left scaled and horizontally scrollable for the rest of the visit.
       * This is the single most common mobile form bug and it is invisible on
       * every desktop browser.
       */}
      <input
        id="offer-amount"
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={offer}
        onChange={handleChange}
        placeholder={formatCurrency(0)}
        className="w-full rounded-lg border border-border-hairline bg-track px-3 py-2.5 text-base font-medium text-ink tabular-nums transition-colors placeholder:text-muted focus:border-accent-ink focus:outline-none sm:text-sm"
      />

      <div className="mt-3">
        <FeeRow label={t('offer.transferFee')} value={formatCurrency(listing.transferFee)} />
        <FeeRow label={t('offer.platformFee')} value={formatCurrency(listing.platformFee)} />
        <FeeRow label={t('offer.totalCost')} value={formatCurrency(total)} emphasis />
      </div>

      <label className="sr-only" htmlFor="offer-message">
        {t('offer.messageLabel')}
      </label>
      <input
        id="offer-message"
        type="text"
        placeholder={t('offer.messageLabel')}
        className="mt-3 w-full rounded-lg border border-border-hairline bg-track px-3 py-2.5 text-base text-ink transition-colors placeholder:text-muted focus:border-accent-ink focus:outline-none sm:text-sm"
      />

      <Button
        type="button"
        fullWidth
        className="mt-3"
        disabled={amount <= 0}
        onClick={() => {
          showOfferNotice()
          onAfterSubmit?.()
        }}
      >
        {/* Full width, so a longer translation wraps rather than overflowing —
            "Enviar oferta por US$ 23.550" is comfortably past the English. */}
        {t('offer.submit', { amount: formatCurrency(amount) })}
      </Button>
    </section>
  )
}
