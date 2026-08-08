import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import StrokeText from '@/shared/components/StrokeText'

/**
 * When the drawn headline finishes, in seconds.
 *
 * StrokeText's outline lands at `drawDuration + stagger × (glyphs − 1)`
 * = 1.6 + 0.05 × 19 = 2.55s, and its wipe — scheduled at `drawDuration +
 * fillDelay` and running `max(0.4, drawDuration / 2)` — lands at 2.60s. The copy
 * below waits for the later of the two, so it never competes with the headline
 * for attention while the headline is still drawing itself.
 *
 * Tied to the props below by hand. Re-wording the headline shifts this by a few
 * hundredths per character, which is invisible for a cue this soft.
 */
const HEADLINE_SETTLES = 2.6

interface TeamsHeroProps {
  /**
   * The headline slot. Left empty, the hero renders its own copy — a bespoke
   * title component drops in here without touching the backdrop.
   */
  children?: ReactNode
}

/**
 * The landing band: stadium footage, the scrim that makes type legible on it,
 * and the brand glow — one component, because those three layers only make
 * sense together.
 *
 * The green radial is the ORIGINAL hero, not decoration bolted on: before the
 * video, layers 2 and 3 *were* the hero. Keeping them means the band reads as
 * this product's while the file streams, and there is no flash of bare video
 * before the scrim lands.
 *
 * Like `AppHeader`, this pins the DARK palette in both themes. Type sits on
 * stadium footage that is dark whatever the user picked, so `text-ink` has to
 * resolve to the light step. The `dark` class is the whole mechanism — the
 * theme is only custom properties scoped to `.dark`, so the slot above needs no
 * special-casing either.
 *
 * `autoPlay` is gated on reduced motion by hand: `MotionConfig` only governs
 * Motion components and the `prefers-reduced-motion` block in globals.css only
 * damps CSS animation. Neither one stops a looping `<video>`.
 */
export function TeamsHero({ children }: TeamsHeroProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section className="dark relative isolate flex min-h-[clamp(340px,50svh,520px)] overflow-hidden">
      <video
        src="/nflstadiums.mp4"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* The scrim. Everything above this point is footage; everything below is type. */}
      <div className="absolute inset-0 bg-page/65" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_-20%,color-mix(in_oklab,var(--psl-accent)_22%,transparent),transparent_60%)]" />
      {/*
       * Fades to `--psl-page`, which inside this dark-pinned subtree is the same
       * #040811 the page paints below — so in dark the band has no seam at all,
       * which is why there is no bottom border to draw one back in.
       */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-page" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16">
        {children ?? (
          <>
            {/*
             * The wordmark opts OUT of `--font-sans`, and has to.
             *
             * `system-ui` resolves to SF Pro on macOS, whose heavy glyphs are
             * built from overlapping component contours — the diagonal of an N,
             * the apex of an A, the middle of an M are separate shapes laid over
             * the stems. Filled, nonzero winding merges them and you never see
             * it. StrokeText *strokes* the outline, so every internal edge gets
             * drawn and those diagonals poke out of the stems as loose slivers.
             * Verified by rendering the same string across font stacks: every
             * grotesque with merged outlines is clean, SF Pro is not.
             *
             * `style` reaches the glyphs because StrokeText puts it on the root
             * span and its <text> only sets size/weight/tracking — font-family
             * inherits. So this fixes the artifact without touching the
             * vendored component.
             */}
            {/* `hero-wordmark` tints the first 10 glyphs — see globals.css. */}
            <h1 className="hero-wordmark w-full">
              <StrokeText
                style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                text="SOME SEATS MEAN MORE"
                strokeColor="#a0f700"
                fillColor="#a0f700"
                strokeWidth={1.4}
                drawDuration={1.6}
                fillDelay={0.2}
                stagger={0.05}
                ease="power2.out"
                trigger="mount"
                fillMode="wipe"
                fontSize={128}
                fontWeight={800}
                letterSpacing={0.5}
              />
            </h1>
            {/*
             * The copy holds until the headline has finished drawing, then rises
             * in. Two beats rather than one so the lines arrive in reading order.
             *
             * Under reduced motion StrokeText jumps straight to its end state, so
             * the delay has to collapse too — otherwise the value proposition
             * would sit invisible for 2.6s waiting on an animation that already
             * finished. `MotionConfig reducedMotion="user"` drops the transform
             * on its own, but it has no opinion about delays.
             */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : HEADLINE_SETTLES,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl"
            >
              Find your team's PSL &amp; Tickets
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : HEADLINE_SETTLES + 0.14,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base"
            >
              The easy, transparent, and secure way to buy and sell personal seat licenses
              and season tickets — with an AI read on every price.
            </motion.p>
          </>
        )}
      </div>
    </section>
  )
}
