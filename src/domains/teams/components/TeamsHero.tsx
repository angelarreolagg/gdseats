import {
  Fragment,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
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
 * The wordmark is **translated**, and the wide layout is ONE `StrokeText` for
 * the whole phrase.
 *
 * **One component, because one component is one GSAP timeline, and that is what
 * makes the draw read as a single headline.** Splitting the phrase into two
 * components gives each its own timeline, both starting at zero — so the two
 * halves sweep simultaneously and the headline animates as two separate texts
 * side by side. It looks fine in a screenshot and wrong in motion, which is
 * exactly how it got shipped once and had to be pulled back.
 *
 * The two-tone split therefore cannot come from having two components. It also
 * cannot come from the CSS rule it used to (`.hero-wordmark`, which retinted the
 * first ten `<tspan>`s): the count was hard-coded to "SOME SEATS", CSS cannot
 * read the copy, and translating the headline cuts such a tint mid-word in three
 * languages at once. So it is applied in a layout effect from the *length of the
 * lead string* — see `useWordmarkTint`.
 *
 * The stacked layout below `sm` is still two components, because it is two
 * lines: the sweeps are on separate rows there, so nothing runs in parallel that
 * the eye reads as one line.
 *
 * **The accessible name is assembled here** and set on the `<h1>`, rather than
 * left to the concatenation of `role="img"` children: the spacing is not
 * something to leave to chance, and it has to be right in a language that does
 * not put spaces between words.
 */
const WORDMARK_SEPARATOR = ' '

/**
 * Literal values of psl-wordmark-lead and psl-accent. The hero is dark-pinned,
 * and both are the same in either theme, so there is nothing to resolve.
 */
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
 * **The CJK faces at the end are what let the wordmark be translated.** Font
 * fallback is per glyph, so Latin copy never reaches them — Helvetica covers it
 * — and Japanese falls through to a face that has the coverage. They were added
 * with the same test the Latin stack was chosen by: stroke the string and look
 * at it, rather than trust the name.
 *
 * `style` reaches the glyphs because StrokeText puts it on the root span and its
 * <text> only sets size/weight/tracking — font-family inherits. So this fixes the
 * artifact without touching the vendored component.
 */
const WORDMARK_FONT = {
  fontFamily:
    "'Helvetica Neue', Helvetica, Arial, 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', sans-serif",
}

/**
 * When the drawn headline finishes, in seconds — **derived, not typed in.**
 *
 * StrokeText's outline lands at `drawDuration + stagger × (glyphs − 1)`, and its
 * wipe — scheduled at `drawDuration + fillDelay` and running
 * `max(0.4, drawDuration / 2)` — lands at 2.60s. The copy below waits for the
 * later of the two, so it never competes with the headline while the headline is
 * still drawing itself.
 *
 * This used to be the hand-computed constant `2.6`, valid only for a 20-glyph
 * English string. Once the headline is translated the glyph count moves with the
 * language — Japanese is half the length — and a hand-tuned number would leave
 * the value proposition sitting invisible for a beat after the draw had already
 * finished.
 *
 * Takes the lines rather than the phrase because the two layouts count
 * differently: wide draws one string in one pass, stacked draws two lines in
 * parallel, so there the longer line is what everything waits on.
 */
function headlineSettles(...lines: string[]): number {
  const glyphs = Math.max(...lines.map((line) => Array.from(line).length))
  const strokeEnds = DRAW.drawDuration + DRAW.stagger * Math.max(0, glyphs - 1)
  const wipeEnds = DRAW.drawDuration + DRAW.fillDelay + Math.max(0.4, DRAW.drawDuration / 2)
  return Math.max(strokeEnds, wipeEnds)
}

/**
 * StrokeText's own viewBox padding: `max(strokeWidth, fontSize × 0.1)` on every
 * side. Included below because it is a *constant* addition to a variable text
 * width — leaving it out biases the ratio toward the shorter line.
 */
const VIEWBOX_PAD = Math.max(DRAW.strokeWidth, DRAW.fontSize * 0.1)

/**
 * How wide a line's artwork is, in units comparable between lines.
 *
 * Only the stacked layout needs this. Two full-width lines each render at
 * whatever size their own length dictates, so the shorter one comes out
 * bigger — invisible while the halves were "SOME SEATS" and "MEAN MORE", and
 * stark once the copy is translated: Spanish's 16-glyph lead against a 9-glyph
 * tail drew the second line at nearly twice the first.
 *
 * Canvas rather than a DOM measurement: no layout pass, no ref, and it is the
 * same text engine the SVG will use. **jsdom has no 2D context**, so it falls
 * back to the glyph count — within a few percent, and there is no rendered size
 * for it to be wrong about there anyway.
 */
function measureUnits(text: string): number {
  const fallback = Array.from(text).length
  if (typeof document === 'undefined') return fallback

  const context = document.createElement('canvas').getContext('2d')
  if (!context) return fallback

  context.font = `${DRAW.fontWeight} ${DRAW.fontSize}px ${WORDMARK_FONT.fontFamily}`
  // Honoured where supported; harmless where not, since it applies to both lines.
  context.letterSpacing = `${DRAW.letterSpacing}px`

  const width = context.measureText(text).width
  return width > 0 ? width + VIEWBOX_PAD * 2 : fallback
}

/**
 * A stacked line's width as a percentage of the longer line's.
 *
 * Both lines have effectively the same viewBox *height*, so widths in proportion
 * to their viewBox widths render at one glyph size. The longer line always takes
 * the full column.
 */
function stackedShare(units: number, otherUnits: number): string {
  return `${(units / Math.max(units, otherUnits)) * 100}%`
}

/**
 * Paints the first `lead.length` glyphs in the lead colour, leaving the rest on
 * the accent the component was given.
 *
 * **This is the two-tone split, and it has to be imperative.** `StrokeText`
 * paints one `strokeColor` / `fillColor` per string, so the split has always
 * come from outside — it used to be `.hero-wordmark` in `globals.css`, whose
 * `nth-child(-n + 10)` was hard-coded to "SOME SEATS". CSS cannot read the copy,
 * so that count could not survive translation. Rendering two components instead
 * would make the split trivial and cost the single continuous draw (see the note
 * on `WORDMARK_SEPARATOR`), which is the more important of the two.
 *
 * So: reach for the tspans and set the colour on the ones that belong to the
 * lead. It is safe against the animation because GSAP only ever writes
 * `strokeDashoffset` / `strokeDasharray` on `[data-stroke-char]` and `opacity` on
 * `[data-fill-char]` — never `stroke` or `fill`. It is safe against React
 * because `StrokeText` keys its tspans by index and re-renders them only when
 * the text changes, which is also when this re-runs.
 *
 * A layout effect rather than an effect, so the tint is in place for the first
 * paint rather than a frame after it.
 *
 * It runs on both layouts even though the stacked one already gets its colours
 * from props: on that branch the first `lead.length` tspans in document order
 * are exactly the lead line's, so the result is identical and there is no branch
 * here to get wrong later.
 */
function useWordmarkTint(
  root: RefObject<HTMLElement | null>,
  lead: string,
  tail: string,
  oneLine: boolean,
) {
  useLayoutEffect(() => {
    const node = root.current
    if (!node) return

    const leadGlyphs = Array.from(lead).length
    // Empty string, not the accent literal: clearing the inline value lets the
    // colour fall back to the `<text>` presentation attribute StrokeText set,
    // which is the one place the accent should be stated.
    node.querySelectorAll<SVGTSpanElement>('[data-stroke-char]').forEach((glyph, index) => {
      glyph.style.stroke = index < leadGlyphs ? LEAD_COLOR : ''
    })
    node.querySelectorAll<SVGTSpanElement>('[data-fill-char]').forEach((glyph, index) => {
      glyph.style.fill = index < leadGlyphs ? LEAD_COLOR : ''
    })
    // `tail` and `oneLine` are dependencies because either one changes which
    // tspans exist, not because their values are read.
  }, [root, lead, tail, oneLine])
}

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
  const { t, i18n } = useTranslation('hero')
  const reduceMotion = useReducedMotion()
  const oneLine = useMediaQuery(ONE_LINE_QUERY)

  const lead = t('wordmark.lead')
  const tail = t('wordmark.tail')
  const wordmark = `${lead}${WORDMARK_SEPARATOR}${tail}`
  // One line draws the whole phrase in one pass; stacked, the two lines draw in
  // parallel, so the longer of them is what the copy below has to wait for.
  const settles = oneLine ? headlineSettles(wordmark) : headlineSettles(lead, tail)
  // Recomputed only when the copy does, i.e. on a language change.
  const leadUnits = useMemo(() => measureUnits(lead), [lead])
  const tailUnits = useMemo(() => measureUnits(tail), [tail])

  const headingRef = useRef<HTMLHeadingElement>(null)
  useWordmarkTint(headingRef, lead, tail, oneLine)

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
          /*
           * **Keyed on the language, which is what replays the draw.**
           *
           * `StrokeText` runs on `trigger: 'mount'`, and the two paragraphs
           * below animate from their `initial` on mount too — so a remount is
           * the whole mechanism, and a keyed Fragment is the cheapest way to
           * force one without adding a DOM node that would join the flex column.
           *
           * It also does real work beyond the animation: StrokeText measures its
           * own `getBBox()` once and caches the viewBox, so a headline whose text
           * changed under it would keep the previous language's box and letterbox
           * or clip the new glyphs. Remounting re-measures.
           */
          <Fragment key={i18n.language}>
            {/*
             * Side by side from `sm` up, stacked below it — a render branch, not
             * a CSS one, because the two layouts size the artwork by different
             * means. Side by side, each svg keeps StrokeText's fixed
             * `fontSize × 1.3` box and `preserveAspectRatio="meet"` scales the
             * glyphs to the width the flex row hands it. Stacked, each takes the
             * full width and the height has to follow (`!h-auto`) — at 350px that
             * is the only way the wordmark is legible at all, instead of a 32px
             * ribbon adrift in a 166px box.
             *
             * The accessible name is set here rather than left to the two
             * `role="img"` children, so it reads identically in both layouts —
             * and so the separator between the halves is a real space even in a
             * language that does not write one.
             */}
            {/*
             * `wordmark-draw` holds the fill at opacity 0 until GSAP takes it
             * over, so the headline cannot paint solid in the frames before
             * StrokeText's own measurement lands. It goes on the `<h1>` and
             * therefore covers both layouts. See globals.css.
             */}
            <h1 ref={headingRef} aria-label={wordmark} className="wordmark-draw w-full">
              {oneLine ? (
                /*
                 * ONE component for the whole phrase, and it must stay one: one
                 * component is one GSAP timeline, which is what draws the
                 * headline as a single left-to-right sweep. Two would animate
                 * the halves simultaneously and read as two separate texts.
                 *
                 * Both colours are the accent here; `useWordmarkTint` repaints
                 * the lead's glyphs afterwards.
                 */
                <StrokeText
                  {...DRAW}
                  style={WORDMARK_FONT}
                  text={wordmark}
                  strokeColor={ACCENT_COLOR}
                  fillColor={ACCENT_COLOR}
                />
              ) : (
                /*
                 * Stacked into two lines, which is the ONE place two components
                 * are correct: they are on separate rows, so their two timelines
                 * do not read as one line drawing twice.
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
                 * WHICH IS ALSO WHY EACH LINE TAKES A SHARE RATHER THAN THE FULL
                 * WIDTH. Two full-width lines render at whatever size their own
                 * length dictates, so the shorter one comes out bigger — invisible
                 * while the halves were "SOME SEATS" and "MEAN MORE", and stark the
                 * moment the copy is translated: Spanish's 16-glyph lead against a
                 * 9-glyph tail drew the second line at nearly twice the first.
                 * Scaling each line by its share of the longer one puts them back
                 * at one size.
                 *
                 * The width goes on StrokeText's own `style` — which lands on its
                 * root span and beats the `w-full` class — and NOT on a wrapper,
                 * for the same reason the margin doesn't: `[&>span>svg]` matches
                 * one level down.
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
                    className="mx-auto"
                    style={{ ...WORDMARK_FONT, width: stackedShare(leadUnits, tailUnits) }}
                    text={lead}
                    strokeColor={LEAD_COLOR}
                    fillColor={LEAD_COLOR}
                  />
                  {/* The margin goes on StrokeText's own root, not on a wrapper:
                      the `[&>span>svg]` above matches one level down, and a
                      wrapper would push this svg out of its reach and leave the
                      second line letterboxed in its 1.3× box. */}
                  <StrokeText
                    {...DRAW}
                    className="mx-auto -mt-2"
                    style={{ ...WORDMARK_FONT, width: stackedShare(tailUnits, leadUnits) }}
                    text={tail}
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
             * would sit invisible for a couple of seconds waiting on an animation that
             * already finished. `MotionConfig reducedMotion="user"` drops the transform
             * on its own, but it has no opinion about delays.
             */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : settles,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-5 text-2xl font-semibold tracking-tight text-balance text-ink sm:mt-6 sm:text-3xl"
            >
              {/* Real text, unlike the wordmark above it — these two lines are
                  the value proposition, so they have to be selectable,
                  translatable, and readable as text by a screen reader. */}
              {t('headline')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : settles + 0.14,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-3 max-w-xl text-sm text-pretty text-muted sm:text-base"
            >
              {t('valueProposition')}
            </motion.p>
          </Fragment>
        )}
      </div>
    </section>
  )
}
