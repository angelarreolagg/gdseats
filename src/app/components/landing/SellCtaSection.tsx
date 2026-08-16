import { ArrowRight } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Reveal } from '@/shared/components/Reveal'
import { SELL_EMAIL, SELL_EMAIL_HREF } from '@/shared/config/contact'
import { showOfferNotice } from '@/shared/utils/demoNotice'

/**
 * The sell-side CTA.
 *
 * **It follows the theme, and must not be pinned dark again.** It shipped with
 * the `dark` class `AppHeader` and `TeamsHero` use, on the argument that light
 * mode is a long pale run and the one moment asking a visitor to act should not
 * be the flattest thing on the page. In light mode that argument bought a
 * near-black slab dropped into a near-white document — it read as a rendering
 * fault, not as emphasis. The two surfaces that *are* pinned have reasons this
 * one never had: the header carries a bright-green mark that a light bar would
 * swallow, and the hero's type sits on dark stadium footage. There is nothing
 * underneath this band forcing the issue.
 *
 * Emphasis now comes from the accent radial and the glow under the button,
 * which work in both palettes because they are `--psl-accent` mixed into
 * whatever the page happens to be.
 *
 * **The content is deliberately not in a card, and that was a correction.** It
 * briefly sat on an accent-tinted panel to mark it as the conversion moment;
 * the panel worked in isolation and was wrong for the page — every other band
 * here is open content on a ground, so a framed box read as a widget dropped
 * into the layout rather than as part of it. The rule this leaves behind: cards
 * in this app hold *things* (a listing, a pillar, a concierge), never a whole
 * section's message.
 *
 * **What marks it as the climax instead:** the radial, the blurred accent pool
 * under the button, and `size="lg"` — a Button prop and
 * never a `className`, because padding handed in that way is a second
 * declaration of a property the component already sets, and two of those
 * resolve by CSS source order rather than class order. The generous `py-20
 * sm:py-28` does the rest of the work the panel's padding was doing: on an open
 * band, space is the frame. No copy was added — the reference's four lines are
 * intact and the section is made special by treatment alone.
 *
 * **No border, and that is a correction rather than an omission.** This shipped
 * with `border-y` to give the band edges. On screen the hairline read as a seam
 * ruled across the page rather than as the edge of a slab — exactly what
 * `TeamsHero` already learned, which is why it has no bottom border either.
 * Don't add it back without looking at it in both modes first.
 */
export function SellCtaSection() {
  return (
    <section className="relative isolate overflow-hidden bg-page">
      {/*
       * The hero's radial, at the other end of the page — same formula, so the
       * two accent washes are recognisably one treatment.
       *
       * It is mixed into `transparent` rather than painted over a fixed ground,
       * so it lands as a soft green haze on `#fbfbfa` and as a glow on
       * `#040811` without a second declaration. Now that the band is not pinned
       * dark, this and the button's halo are the only things separating the
       * section from the page, in either mode.
       */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_120%_at_50%_120%,color-mix(in_oklab,var(--psl-accent)_16%,transparent),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Ready to sell your PSL?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base">
            We handle bulk sales as well
          </p>
        </Reveal>

        <Reveal delay={0.14}>
          {/*
           * With no panel, the halo is what makes this the climax rather than a
           * third centred text block. A blurred accent pool sitting behind the
           * button in the stack, so it reads as the button emitting light rather
           * than as a second shape. `pointer-events-none` matters: it overhangs
           * 12px on every side and would otherwise swallow a click aimed just
           * past the edge.
           */}
          <div className="relative mt-8 inline-block">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-3 rounded-full bg-accent/25 blur-xl"
            />
            <Button size="lg" onClick={showOfferNotice} className="group/cta relative">
              Start selling
              {/* Named group, not the bare `group`: the arrow answers the
                  BUTTON's hover. An unnamed one would fire from any ancestor
                  that later became a group, which reads as the page twitching. */}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/cta:translate-x-1"
                strokeWidth={2.5}
              />
            </Button>
          </div>

          <p className="mt-5 text-sm text-muted">
            Or email us at{' '}
            <a
              href={SELL_EMAIL_HREF}
              className="rounded font-semibold text-accent-ink underline underline-offset-2"
            >
              {SELL_EMAIL}
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
