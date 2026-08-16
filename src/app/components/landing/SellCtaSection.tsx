import { Button } from '@/shared/components/Button'
import { Reveal } from '@/shared/components/Reveal'
import { SELL_EMAIL, SELL_EMAIL_HREF } from '@/shared/config/contact'
import { showOfferNotice } from '@/shared/utils/demoNotice'

/**
 * The sell-side CTA, and the only band below the hero that pins the dark
 * palette in both themes.
 *
 * The mechanism is the single `dark` class on the root, the same one `AppHeader`
 * and `TeamsHero` use: the theme is nothing but custom properties scoped to
 * `.dark`, so every token inside this subtree re-resolves and the children need
 * no special-casing at all. `Button`'s `bg-accent text-on-accent` is identical
 * in both modes, so the CTA needs no adjustment either.
 *
 * It is pinned because the page needs a dark bookend. Everything between here
 * and the hero follows the theme, and in light mode that is a long pale run
 * ending in a pale footer — the one moment asking a visitor to act should not
 * be the flattest thing on the page.
 *
 * **No border, and that is a correction rather than an omission.** This shipped
 * with `border-y`, on the reasoning that in dark mode the band and the page are
 * both `#040811` and the section would otherwise have no edges. On screen the
 * hairline read as a seam ruled across the page, not as the edge of a slab —
 * exactly what `TeamsHero` already learned, which is why it has no bottom
 * border either. The radial below is what gives the band presence in dark mode;
 * in light, a near-black block on `#fbfbfa` separates itself and never needed
 * the help. Don't add it back without looking at it in dark mode first.
 */
export function SellCtaSection() {
  return (
    <section className="dark relative isolate overflow-hidden bg-page">
      {/* The hero's radial, at the other end of the page. Same formula, so the
          two dark bands are recognisably the same treatment. */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_120%_at_50%_120%,color-mix(in_oklab,var(--psl-accent)_16%,transparent),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-20">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Ready to sell your PSL?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base">
            We handle bulk sales as well
          </p>
        </Reveal>

        <Reveal delay={0.14}>
          <Button onClick={showOfferNotice} className="mt-8 px-8 py-4 text-base">
            Start selling
          </Button>

          <p className="mt-4 text-sm text-muted">
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
