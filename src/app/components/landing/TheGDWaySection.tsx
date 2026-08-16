import { Eye, ShieldCheck, Zap, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/shared/components/Reveal'

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
    Icon: ShieldCheck,
    title: 'Secure',
    body: 'Every license and seller is verified before it reaches the board, and escrow holds the funds until the club confirms the transfer. Both sides are covered.',
  },
  {
    Icon: Zap,
    title: 'Easy to use',
    body: 'Pick a team, read the verdict, make an offer. The paperwork and the club transfer rules are ours to handle, not yours to learn.',
  },
  {
    Icon: Eye,
    title: 'Transparent',
    body: 'The full total is on the listing before you commit — no hidden fees, and a full refund if the transfer does not go through.',
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
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
          The <span className="text-accent-ink">G&amp;D Seats</span> way
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-pretty text-muted sm:text-base">
          Why this is the straightest route to a seat license — buying or selling.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-10 sm:mt-14 sm:grid-cols-3 sm:gap-8">
        {PILLARS.map((pillar, index) => (
          // The stagger is the hero's 0.14s beat. The three land in reading
          // order rather than together, which is what makes a row of three
          // read as a sequence instead of a wall.
          <Reveal key={pillar.title} delay={index * 0.14}>
            <span className="flex size-11 items-center justify-center rounded-full bg-accent/12 text-accent-ink ring-1 ring-accent-ink/15">
              <pillar.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-tight text-ink">
              {pillar.title}
            </h3>
            <p className="mt-2 text-sm text-pretty text-muted">{pillar.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
