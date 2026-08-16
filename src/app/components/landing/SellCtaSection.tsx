import { ArrowRight } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { Reveal } from '@/shared/components/Reveal'
import { SELL_EMAIL, SELL_EMAIL_HREF } from '@/shared/config/contact'
import { showOfferNotice } from '@/shared/utils/demoNotice'

/**
 * The sell-side CTA.
 *
 * **Follows the theme; must not be pinned dark again.** In light mode the `dark`
 * class produced a near-black slab in a near-white document, which read as a
 * rendering fault. The two surfaces that do pin dark have reasons this never had.
 *
 * No card and no border, both corrections: every other band here is open content
 * on a ground, and `border-y` read as a seam ruled across the page. Emphasis
 * comes from the radial, the button halo and `size="lg"` — a Button prop, never
 * a `className`, since two declarations of one property resolve by source order.
 */
export function SellCtaSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="relative isolate overflow-hidden bg-page">
      {/* The hero's radial formula, mixed into `transparent` so it lands as a haze on
          #fbfbfa and a glow on #040811 with no second declaration. */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_120%_at_50%_120%,color-mix(in_oklab,var(--psl-accent)_16%,transparent),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            {t('sell.heading')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base">
            {t('sell.subheading')}
          </p>
        </Reveal>

        <Reveal delay={0.14}>
          {/* A blurred accent pool behind the button, so it reads as the button emitting
              light. `pointer-events-none` — it overhangs 12px and would swallow clicks. */}
          <div className="relative mt-8 inline-block">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-3 rounded-full bg-accent/25 blur-xl"
            />

            <Button size="lg" onClick={showOfferNotice} className="group/cta relative">
              {t('sell.cta')}
              {/* Named group: the arrow answers the BUTTON's hover, not any ancestor that
                  later becomes a group. */}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/cta:translate-x-1"
                strokeWidth={2.5}
              />
            </Button>
          </div>

          <p className="mt-5 text-sm text-muted">
            {/* One translatable sentence with a named tag, so the address can sit wherever
                the language puts it. */}
            <Trans
              i18nKey="landing:sell.email"
              values={{ address: SELL_EMAIL }}
              components={{
                email: (
                  <a
                    href={SELL_EMAIL_HREF}
                    className="rounded font-semibold text-accent-ink underline underline-offset-2"
                  />
                ),
              }}
            />
          </p>
        </Reveal>
      </div>
    </section>
  )
}
