import { CircleCheck, FingerprintPattern, Phone, Sparkles } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Reveal } from '@/shared/components/Reveal'
import { CONCIERGE_PHONE, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/shared/config/contact'
import { showOfferNotice } from '@/shared/utils/demoNotice'
import { SymmetricWave } from './SymmetricWave'

const ASSURANCE_KEYS = ['quick', 'always', 'noSignup'] as const

/**
 * The AI concierge card.
 *
 * `holo-ring` is this app's mark for a machine's read on a market — worn
 * otherwise only by `AIInsightPanel` and the verdict chips.
 *
 * **Two phone numbers, and the split is the point.** The green button dials an
 * AI that does not exist, so it is a `<button>`, never `<a href="tel:">`. The
 * "prefer a human" line is the house number and IS a real anchor, since `tel:`
 * works without a backend.
 */
export function ConciergeSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
      <Reveal>
        <div className="holo-ring rounded-2xl border border-border-hairline bg-surface p-6 shadow-card sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-12">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-accent-ink uppercase">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                {t('concierge.eyebrow')}
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
                {t('concierge.heading')}
              </h2>

              <p className="mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base">
                {t('concierge.body')}
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {ASSURANCE_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-1.5 text-xs text-muted">
                    <CircleCheck
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-accent-ink"
                      strokeWidth={2}
                    />
                    {t(`concierge.assurances.${key}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* The `Card` primitive — a nested surface, so it takes the app's border and
                radius rather than a bespoke box. */}
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
                  {t('concierge.available')}
                </span>
                <SymmetricWave />
              </div>

              <Button
                fullWidth
                onClick={showOfferNotice}
                className="mt-4 text-base"
                aria-label={t('concierge.callAria', { phone: CONCIERGE_PHONE })}
              >
                <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {CONCIERGE_PHONE}
              </Button>

              {/* The fingerprint marks the human route out of an AI panel, opposite the
                  `Phone` above. `flex-wrap` so a narrow card breaks between mark and
                  sentence instead of stranding the glyph. */}
              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-xs text-muted">
                <FingerprintPattern
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-accent-ink"
                  strokeWidth={2}
                />
                <span>
                  {/* `<Trans>`: the anchor sits mid-sentence, and where differs by language. The
                      number is a value, not copy, so a translator cannot change the digits the
                      footer also prints. */}
                  <Trans
                    i18nKey="landing:concierge.human"
                    values={{ number: CONTACT_PHONE }}
                    components={{
                      phone: (
                        <a
                          href={CONTACT_PHONE_HREF}
                          className="rounded font-semibold text-accent-ink underline underline-offset-2"
                        />
                      ),
                    }}
                  />
                </span>
              </p>
            </Card>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
