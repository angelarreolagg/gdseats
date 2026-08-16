import { Eye, Lock, Zap, type LucideIcon } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Reveal } from '@/shared/components/Reveal'
import { ShinyText } from '@/shared/components/ShinyText'
import { SpotlightCard } from '@/shared/components/SpotlightCard'
import { SITE_NAME } from '@/shared/config/site'

interface Pillar {
  Icon: LucideIcon
  /** Locale-file id, not a title — the words live in `landing.json`. */
  id: 'secure' | 'easy' | 'transparent'
}

/** Three pillars: they sit in one row on desktop, so a fourth would wrap. */
const PILLARS: Pillar[] = [
  { Icon: Lock, id: 'secure' },
  { Icon: Zap, id: 'easy' },
  { Icon: Eye, id: 'transparent' },
]

/**
 * The trust band under the team grid: whether handing over five figures here is
 * sane. Deliberately the plainest section on the page — trust copy that arrives
 * dressed up reads as a sales pitch.
 */
export function TheGDWaySection() {
  const { t } = useTranslation('landing')

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <Reveal className="text-center">
        {/* `ShinyText` paints with a moving gradient, so a `text-*` utility does
            nothing here. Slow with a long hold: a glint every ~6s, where the stock 2s
            loop on a heading reads as a loading state. */}
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
          {/* `<Trans>`, not three fragments: the brand sits mid-sentence in English and
              at the front in pt/ja. `ShinyText` reads its own `text` prop, so the brand
              inside the tag is never rendered — and the glyphs stay real text, so the
              `<h2>` announces as one sentence. */}
          <Trans
            i18nKey="landing:gdWay.heading"
            components={{ brand: <ShinyText text={SITE_NAME} speed={2.5} /> }}
          />
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-pretty text-muted sm:text-base">
          {t('gdWay.subheading')}
        </p>
      </Reveal>

      {/* Tighter than the bare-column version: each pillar carries its own padding
          now, so the old `gap-10` would be counted twice. */}
      <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6">
        {PILLARS.map((pillar, index) => (
          // `h-full` on both wrapper and card: the grid stretches only the wrapper, and
          // the three bodies are different lengths.
          <Reveal key={pillar.id} delay={index * 0.14} className="h-full">
            {/* `group` lets the medallion answer the card's hover — the spotlight is
                painted on a layer the children never see. */}
            <SpotlightCard className="group h-full">
              {/* Mark and title on one baseline: stacked, the medallion read as a stray
                  ornament rather than the heading's bullet. */}
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent-ink ring-1 ring-accent-ink/15 transition duration-300 group-hover:-translate-y-px group-hover:bg-accent/20 group-hover:ring-accent-ink/35">
                  <pillar.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
                </span>

                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {t(`gdWay.pillars.${pillar.id}.title`)}
                </h3>
              </div>
              <p className="mt-4 text-sm text-pretty text-muted">
                {t(`gdWay.pillars.${pillar.id}.body`)}
              </p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
