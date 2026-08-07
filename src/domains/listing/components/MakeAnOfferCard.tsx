import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { formatCurrency } from '@/shared/utils/formatters'
import type { Listing } from '../types/listing.types'
import { getTotalPrice } from '../types/listing.types'

interface MakeAnOfferCardProps {
  listing: Listing
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

export function MakeAnOfferCard({ listing }: MakeAnOfferCardProps) {
  const [offer, setOffer] = useState(String(getTotalPrice(listing)))
  const parsedOffer = Number(offer) || 0
  const total = parsedOffer + listing.transferFee + listing.platformFee

  return (
    <section className="rounded-xl border border-border-hairline bg-surface p-4 shadow-card">
      <h2 className="text-sm font-semibold text-ink">
        Make an offer <span className="text-over">*</span>
      </h2>

      <label className="sr-only" htmlFor="offer-amount">
        Offer amount
      </label>
      <input
        id="offer-amount"
        type="number"
        value={offer}
        onChange={(event) => setOffer(event.target.value)}
        className="mt-3 w-full rounded-lg border border-border-hairline bg-track px-3 py-2.5 text-sm font-medium text-ink tabular-nums transition-colors focus:border-accent-ink focus:outline-none"
      />

      <div className="mt-3">
        <FeeRow label="Transfer fee" value={formatCurrency(listing.transferFee)} />
        <FeeRow label="Platform fee" value={formatCurrency(listing.platformFee)} />
        <FeeRow label="Total cost · Includes all fees" value={formatCurrency(total)} emphasis />
      </div>

      <label className="sr-only" htmlFor="offer-message">
        Add a message
      </label>
      <input
        id="offer-message"
        type="text"
        placeholder="Add a message"
        className="mt-3 w-full rounded-lg border border-border-hairline bg-track px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent-ink focus:outline-none"
      />

      <Button type="button" fullWidth className="mt-3">
        Submit offer for {formatCurrency(parsedOffer)}
      </Button>
    </section>
  )
}
