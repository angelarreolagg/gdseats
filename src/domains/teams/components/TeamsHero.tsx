import type { ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'

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
    <section className="dark relative isolate flex min-h-[420px] overflow-hidden border-b border-border-hairline sm:min-h-[520px]">
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
      {/* Fades into the grid below, so the band has no hard seam against the page. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-page" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        {children ?? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
              Find your team's PSL &amp; Tickets
            </h1>
            <p className="mt-4 max-w-xl text-sm text-pretty text-muted sm:text-base">
              The easy, transparent, and secure way to buy and sell personal seat licenses
              and season tickets — with an AI read on every price.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
