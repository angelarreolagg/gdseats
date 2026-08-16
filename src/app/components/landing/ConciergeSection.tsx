import { CircleCheck, Phone, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Reveal } from '@/shared/components/Reveal'
import { CONCIERGE_PHONE, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/shared/config/contact'
import { showOfferNotice } from '@/shared/utils/demoNotice'
import { VoiceBars } from './VoiceBars'

const ASSURANCES = ['Takes a minute', 'Available 24/7', 'No signup required']

/**
 * The AI concierge card.
 *
 * The card wears `holo-ring`, which is not decoration picked for this band: the
 * iridescent border is this app's established mark for a machine's read on the
 * market, and it is otherwise worn only by `AIInsightPanel` and the verdict
 * chips. A visitor who has been through the buy flow has already learned what
 * the shimmer means, so the section is pre-labelled before a word is read. It
 * masks to the border, so the surface stays solid and the measured text
 * contrast still holds.
 *
 * **Two phone numbers, and the split is the point.** The green button dials an
 * AI that does not exist, so it is a `<button>` that answers with the demo
 * invitation — never an `<a href="tel:">`, which would promise a call that
 * cannot connect. The "prefer a human" line underneath is the real (invented,
 * 555-range) house number and IS a genuine anchor, the same one the footer
 * lists, because `tel:` works without a backend. One number behind both would
 * mean the same digits were a link in one place and a button in another.
 */
export function ConciergeSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
      <Reveal>
        <div className="holo-ring rounded-2xl border border-border-hairline bg-surface p-6 shadow-card sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-12">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-accent-ink uppercase">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                AI voice concierge
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
                Tell Scout what you&rsquo;re after
              </h2>

              <p className="mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base">
                Scout is our AI concierge. Say the section you want, the budget you have
                and what matters most about the seat — then let it work the board and
                come back with the options worth your time.
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {ASSURANCES.map((assurance) => (
                  <li key={assurance} className="flex items-center gap-1.5 text-xs text-muted">
                    <CircleCheck
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-accent-ink"
                      strokeWidth={2}
                    />
                    {assurance}
                  </li>
                ))}
              </ul>
            </div>

            {/* The inset panel is the `Card` primitive — a nested surface inside
                the holo card, so it needs the border and radius the rest of the
                app's cards use rather than a bespoke box. */}
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
                  Scout is available now
                </span>
                <VoiceBars />
              </div>

              <Button
                fullWidth
                onClick={showOfferNotice}
                className="mt-4 text-base"
                aria-label={`Call Scout at ${CONCIERGE_PHONE}`}
              >
                <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {CONCIERGE_PHONE}
              </Button>

              <p className="mt-3 text-center text-xs text-muted">
                Prefer a human?{' '}
                <a
                  href={CONTACT_PHONE_HREF}
                  className="rounded font-semibold text-accent-ink underline underline-offset-2"
                >
                  {CONTACT_PHONE}
                </a>
              </p>
            </Card>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
