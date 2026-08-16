import { Eye, Lock, Zap, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/shared/components/Reveal'
import { ShinyText } from '@/shared/components/ShinyText'
import { SpotlightCard } from '@/shared/components/SpotlightCard'

interface Pillar {
  Icon: LucideIcon
  title: string
  body: string
}

/**
 * Three pillars, no more. They sit in one row on a desktop, so a fourth would
 * either wrap into a lonely second row or squeeze all four under the width a
 * sentence needs to stay readable.
 */
const PILLARS: Pillar[] = [
  {
    Icon: Lock,
    title: 'Secure',
    body: 'Find verified licenses and sellers that you can trust, plus our escrow service protects both the buyer and seller.',
  },
  {
    Icon: Zap,
    title: 'Easy to use',
    body: "Our goal is to make the process as easy as possible. Don't worry about the paperwork and transfer rules, we handle it all for you.",
  },
  {
    Icon: Eye,
    title: 'Transparent',
    body: 'No hidden fees or surprises. 100% refundable if the transaction does not go through.',
  },
]

/**
 * The trust triptych, and the first thing under the team grid.
 *
 * A visitor who scrolled past 24 franchise cards has established that we have
 * inventory; this band answers the question that follows, which is whether
 * handing over five figures here is sane. It is deliberately the plainest
 * section on the page — no card chrome, no holo, no accent fills beyond the
 * medallions. Trust copy that arrives dressed up reads as a sales pitch.
 *
 * The heading tints the brand words with `--psl-accent-ink`, never the raw
 * brand green: `#a0f700` is 1.33:1 on the light page and would be unreadable
 * for half the audience. `accent-ink` is the darker step of the same hue and
 * measures 4.8:1 there, resolving back to the bright green in dark mode.
 */
export function TheGDWaySection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <Reveal className="text-center">
        {/*
         * The brand words are `ShinyText`, which paints them with a moving
         * gradient rather than a colour — so no `text-accent-ink` here; a text
         * utility on that span would do nothing, since the fill is transparent
         * and the gradient is the colour. The glyphs stay real selectable text,
         * unlike the hero's wordmark, so the heading's accessible name is the
         * whole sentence with no `aria-label` needed.
         *
         * Slower than the component's default and with a long hold: a sweep
         * every ~6s reads as an occasional glint on a heading a visitor is
         * trying to read, where the stock 2s loop reads as a loading state.
         */}
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
          The <ShinyText text="G&D Seats" speed={2.5} /> way
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-pretty text-muted sm:text-base">
          Find out why G&amp;D Seats is the best platform to buy and sell personal seat
          licenses.
        </p>
      </Reveal>

      {/*
       * `gap-4 sm:gap-6`, tighter than the bare-column version this replaced:
       * each pillar now carries its own `p-6 sm:p-8`, so the old `gap-10` would
       * be counted twice and the row would read as three unrelated boxes.
       */}
      <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6">
        {PILLARS.map((pillar, index) => (
          // The stagger is the hero's 0.14s beat. The three land in reading
          // order rather than together, which is what makes a row of three
          // read as a sequence instead of a wall.
          //
          // `h-full` on both the reveal wrapper and the card: the grid stretches
          // its items, but that only reaches the wrapper — without it the card
          // shrinks to its own copy and the three end at different depths, which
          // the bodies (two, three and two lines) guarantee.
          <Reveal key={pillar.title} delay={index * 0.14} className="h-full">
            {/*
             * `group` is what lets the medallion answer the card's own hover.
             * The spotlight is painted by SpotlightCard on a layer the children
             * never see, so without a group the icon would sit inert while the
             * surface lit up around it — the thing that made the old layout read
             * as two unrelated pieces.
             */}
            <SpotlightCard className="group h-full">
              {/*
               * Mark and title on one line. Stacked, the medallion floated a
               * clear 20px above the words it labels and read as a stray
               * ornament; on the same baseline it reads as the heading's own
               * bullet, and the card gains a header band it did not have.
               */}
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent-ink ring-1 ring-accent-ink/15 transition duration-300 group-hover:-translate-y-px group-hover:bg-accent/20 group-hover:ring-accent-ink/35">
                  <pillar.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
                </span>
                {/* `shrink-0` above, so a two-word title wraps rather than
                    squeezing the mark out of square. */}
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {pillar.title}
                </h3>
              </div>
              <p className="mt-4 text-sm text-pretty text-muted">{pillar.body}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
