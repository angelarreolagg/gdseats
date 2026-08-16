import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import StrokeText from '@/shared/components/StrokeText'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import heroStadiums from '@/assets/hero-stadiums.mp4'

/**
 * The footage is IMPORTED, not referenced from `public/`, and that is a caching
 * decision rather than a tidiness one.
 *
 * Vite fingerprints imported assets (`hero-stadiums-a1b2c3.mp4`), and only a
 * fingerprinted filename can safely be served `immutable` — the name changes
 * whenever the bytes do, so a year-long cache can never go stale. A file in
 * `public/` keeps its name forever, so the best any host can offer is
 * revalidate-on-every-visit. `vercel.json` grants the long cache to
 * `/assets/*`; this import is what makes the video eligible for it.
 *
 * That is the whole "loads instantly on a repeat visit" story: zero bytes, zero
 * round trips, straight from disk.
 */

/**
 * The exact codec string of the encode we ship, read out of the file's `avcC`
 * box rather than guessed: H.264 High profile (0x64), no constraint flags
 * (0x00), level 4.0 (0x28).
 *
 * It has to be right. A browser that cannot decode the listed codec skips the
 * `<source>` silently — and with one source, skipping it means the hero plays
 * nothing at all and never reports an error. **Re-read this from the file if
 * the video is ever re-encoded**; do not carry it over on faith.
 */
const HERO_CODEC = 'video/mp4; codecs="avc1.640028"'

/**
 * The headline, and the two halves it splits into.
 *
 * `WORDMARK` is the accessible name in both layouts, set on the `<h1>` itself
 * rather than left to the concatenation of two `role="img"` children — the
 * spacing between them is not something to leave to chance.
 */
const WORDMARK = 'SOME SEATS MEAN MORE'
const WORDMARK_LEAD = 'SOME SEATS'
const WORDMARK_TAIL = 'MEAN MORE'

/** Literal values of psl-wordmark-lead and psl-accent. The hero is dark-pinned,
 *  and both are the same in either theme, so there is nothing to resolve. */
const LEAD_COLOR = '#d3d7db'
const ACCENT_COLOR = '#a0f700'

/** Below this the wordmark stacks; above it, one line. Matches Tailwind's `sm`. */
const ONE_LINE_QUERY = '(min-width: 640px)'

const DRAW = {
  strokeWidth: 1.4,
  drawDuration: 1.6,
  fillDelay: 0.2,
  stagger: 0.05,
  ease: 'power2.out',
  trigger: 'mount',
  fillMode: 'wipe',
  fontSize: 96,
  fontWeight: 800,
  letterSpacing: 0.5,
} as const

/**
 * The wordmark opts OUT of `--font-sans`, and has to.
 *
 * `system-ui` resolves to SF Pro on macOS, whose heavy glyphs are built from
 * overlapping component contours — the diagonal of an N, the apex of an A, the
 * middle of an M are separate shapes laid over the stems. Filled, nonzero winding
 * merges them and you never see it. StrokeText *strokes* the outline, so every
 * internal edge gets drawn and those diagonals poke out of the stems as loose
 * slivers. Verified by rendering the same string across font stacks: every
 * grotesque with merged outlines is clean, SF Pro is not.
 *
 * `style` reaches the glyphs because StrokeText puts it on the root span and its
 * <text> only sets size/weight/tracking — font-family inherits. So this fixes the
 * artifact without touching the vendored component.
 */
const WORDMARK_FONT = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }

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
  const oneLine = useMediaQuery(ONE_LINE_QUERY)

  return (
    <section className="dark relative isolate flex min-h-[clamp(300px,40svh,520px)] overflow-hidden">
      {/*
       * A `<source>` rather than a `src`, so the browser can reject a codec it
       * cannot decode before spending a request on it — and so additional
       * encodes (AV1 first, a narrow mobile cut behind `media`) drop in above
       * this line without restructuring the element. With a single H.264 source
       * there is nothing to negotiate yet; the shape is what is being set up.
       *
       * `preload="auto"`, not `"metadata"`: `autoPlay` overrides `preload`
       * anyway, so `"metadata"` only ever misdescribed what this element does.
       */}
      <video
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={heroStadiums} type={HERO_CODEC} />
      </video>

      {/* The scrim. Everything above this point is footage; everything below is type. */}
      <div className="absolute inset-0 bg-page/65" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_-20%,color-mix(in_oklab,var(--psl-accent)_22%,transparent),transparent_60%)]" />
      {/*
       * Fades to `--psl-page`, which inside this dark-pinned subtree is the same
       * #040811 the page paints below — so in dark the band has no seam at all,
       * which is why there is no bottom border to draw one back in.
       */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-page" />

      {/*
       * `py` is the only lever left on a short screen — the content is the real
       * floor, since the wordmark's SVG box is a fixed multiple of its font size.
       * Mobile takes the tighter value so the first row of team cards clears the
       * fold, which is the whole reason the height is a clamp and not a number.
       */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-16">
        {children ?? (
          <>
            {/*
             * One line from `sm` up, two stacked below it — a render branch, not
             * a CSS one, because StrokeText scales its artwork to the width it is
             * given. Two half-length lines in a 1216px column would each render
             * at roughly twice the glyph height of the single line and swallow
             * the hero; at 350px they are the only way the wordmark is legible at
             * all, instead of a 32px ribbon adrift in a 166px box.
             *
             * The accessible name is set here rather than left to the two
             * `role="img"` children, so it reads identically in both layouts.
             */}
            {/*
             * `wordmark-draw` is on BOTH branches, where `hero-wordmark` is on
             * one: it holds the fill at opacity 0 until GSAP takes it over, so
             * the headline cannot paint solid in the frames before StrokeText's
             * clipPath exists. See globals.css.
             */}
            <h1
              aria-label={WORDMARK}
              className={oneLine ? 'hero-wordmark wordmark-draw w-full' : 'wordmark-draw w-full'}
            >
              {oneLine ? (
                /* One string, so the two-tone split has to come from CSS:
                   `hero-wordmark` retints the first 10 glyphs — see globals.css. */
                <StrokeText
                  {...DRAW}
                  style={WORDMARK_FONT}
                  text={WORDMARK}
                  strokeColor={ACCENT_COLOR}
                  fillColor={ACCENT_COLOR}
                />
              ) : (
                /*
                 * Split into two components, so each carries its own colour and
                 * the `nth-child(-n + 10)` rule is not involved at all — the
                 * fragile coupling between that count and the copy simply does
                 * not exist on this branch.
                 *
                 * `!h-auto` overrides StrokeText's inline `fontSize × 1.3` box.
                 * Left alone each line is letterboxed inside that band and the
                 * pair stands twice as tall as its own artwork.
                 *
                 * THE TWO SIZE LEVERS HERE ARE NOT THE ONES YOU EXPECT.
                 *
                 * `fontSize` does nothing to the rendered size on this branch. The
                 * svg is `w-full` with an auto height, so it fills whatever width
                 * it is given and its height follows the viewBox aspect — and the
                 * aspect is unchanged by `fontSize`, because the glyph box and the
                 * padding around it (`max(strokeWidth, fontSize × 0.1)`) scale
                 * together. `fontSize` is the internal coordinate system, not a
                 * size. **Width is the only size control.** `w-[85%]` is what makes
                 * the wordmark 15% smaller.
                 *
                 * The gap between the lines is not a gap either — it is that same
                 * 10%-of-fontSize padding baked into each svg's viewBox, top and
                 * bottom, so roughly a fifth of a line box sits empty between them
                 * and no `gap` utility can reach it. `-mt-2` on the second line
                 * pulls back most of it. Do not push it much past this: the
                 * padding is also what keeps the stroke from being clipped at the
                 * viewBox edge.
                 */
                <span className="mx-auto block w-[85%] [&>span>svg]:!h-auto">
                  <StrokeText
                    {...DRAW}
                    style={WORDMARK_FONT}
                    text={WORDMARK_LEAD}
                    strokeColor={LEAD_COLOR}
                    fillColor={LEAD_COLOR}
                  />
                  {/* The margin goes on StrokeText's own root, not on a wrapper:
                      the `[&>span>svg]` above matches one level down, and a
                      wrapper would push this svg out of its reach and leave the
                      second line letterboxed in its 1.3× box. */}
                  <StrokeText
                    {...DRAW}
                    className="-mt-2"
                    style={WORDMARK_FONT}
                    text={WORDMARK_TAIL}
                    strokeColor={ACCENT_COLOR}
                    fillColor={ACCENT_COLOR}
                  />
                </span>
              )}
            </h1>
            {/*
             * The copy holds until the headline has finished drawing, then rises
             * in. Two beats rather than one so the lines arrive in reading order:
             * promise, then detail.
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
              className="mt-5 text-2xl font-semibold tracking-tight text-balance text-ink sm:mt-6 sm:text-3xl"
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
