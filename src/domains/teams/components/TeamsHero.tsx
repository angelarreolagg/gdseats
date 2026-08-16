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
// Imported, not a `public/` path: Vite fingerprints it, which is what makes it
// eligible for the `immutable` cache `vercel.json` grants `/assets/*`.
import heroStadiums from '@/assets/hero-stadiums.mp4'

/**
 * Read from the file's `avcC` box: H.264 High profile, level 4.0. Re-read it on
 * any re-encode — a browser that cannot decode the advertised codec skips the
 * `<source>` silently, and with one source that is an empty hero with no error.
 */
const HERO_CODEC = 'video/mp4; codecs="avc1.640028"'

/** Joins the two halves for the `<h1>`'s accessible name. Japanese writes none. */
const WORDMARK_SEPARATOR = ' '

/** Literal psl-wordmark-lead and psl-accent; the hero is dark-pinned either way. */
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
 * Must keep merged glyph outlines: StrokeText strokes them, so SF Pro's
 * overlapping contours show as slivers. The CJK faces give the translated
 * wordmark coverage — fallback is per glyph, so Latin never reaches them.
 */
const WORDMARK_FONT = {
  fontFamily:
    "'Helvetica Neue', Helvetica, Arial, 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', sans-serif",
}

/**
 * When the draw finishes, in seconds. Derived, because the glyph count moves
 * with the language. Takes lines, not the phrase: stacked draws two in parallel.
 */
function headlineSettles(...lines: string[]): number {
  const glyphs = Math.max(...lines.map((line) => Array.from(line).length))
  const strokeEnds = DRAW.drawDuration + DRAW.stagger * Math.max(0, glyphs - 1)
  const wipeEnds = DRAW.drawDuration + DRAW.fillDelay + Math.max(0.4, DRAW.drawDuration / 2)
  return Math.max(strokeEnds, wipeEnds)
}

/** StrokeText's viewBox padding, `max(strokeWidth, fontSize × 0.1)` per side. */
const VIEWBOX_PAD = Math.max(DRAW.strokeWidth, DRAW.fontSize * 0.1)

/**
 * A line's artwork width, for the stacked layout only. Two full-width lines
 * render at whatever size their own length dictates, so the shorter comes out
 * bigger. jsdom has no 2D context and falls back to the glyph count.
 */
function measureUnits(text: string): number {
  const fallback = Array.from(text).length
  if (typeof document === 'undefined') return fallback

  const context = document.createElement('canvas').getContext('2d')
  if (!context) return fallback

  context.font = `${DRAW.fontWeight} ${DRAW.fontSize}px ${WORDMARK_FONT.fontFamily}`
  context.letterSpacing = `${DRAW.letterSpacing}px`

  const width = context.measureText(text).width
  return width > 0 ? width + VIEWBOX_PAD * 2 : fallback
}

/** Widths in proportion to viewBox widths render at one glyph size. */
function stackedShare(units: number, otherUnits: number): string {
  return `${(units / Math.max(units, otherUnits)) * 100}%`
}

/**
 * Tints the lead's glyphs, since StrokeText paints one colour per string.
 *
 * Imperative because the alternative — one component per half — gives each its
 * own GSAP timeline and draws the headline as two texts sweeping in parallel.
 * Safe against the animation (GSAP writes only dash offsets and opacity) and
 * against React (tspans are keyed by index and re-render only on a text change).
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
    // `''` rather than the accent, so the rest falls back to the `<text>`
    // presentation attribute and the accent is stated in one place.
    node.querySelectorAll<SVGTSpanElement>('[data-stroke-char]').forEach((glyph, index) => {
      glyph.style.stroke = index < leadGlyphs ? LEAD_COLOR : ''
    })
    node.querySelectorAll<SVGTSpanElement>('[data-fill-char]').forEach((glyph, index) => {
      glyph.style.fill = index < leadGlyphs ? LEAD_COLOR : ''
    })
    // `tail` and `oneLine` change which tspans exist; their values are not read.
  }, [root, lead, tail, oneLine])
}

interface TeamsHeroProps {
  /** Headline slot; empty renders the built-in copy. */
  children?: ReactNode
}

/**
 * The landing band: footage, scrim, brand glow.
 *
 * Pins the DARK palette in both themes — the type sits on footage that is dark
 * whichever the user picked. `autoPlay` is gated on reduced motion by hand;
 * neither `MotionConfig` nor the CSS block stops a looping `<video>`.
 */
export function TeamsHero({ children }: TeamsHeroProps) {
  const { t, i18n } = useTranslation('hero')
  const reduceMotion = useReducedMotion()
  const oneLine = useMediaQuery(ONE_LINE_QUERY)

  const lead = t('wordmark.lead')
  const tail = t('wordmark.tail')
  const wordmark = `${lead}${WORDMARK_SEPARATOR}${tail}`
  const settles = oneLine ? headlineSettles(wordmark) : headlineSettles(lead, tail)
  const leadUnits = useMemo(() => measureUnits(lead), [lead])
  const tailUnits = useMemo(() => measureUnits(tail), [tail])

  const headingRef = useRef<HTMLHeadingElement>(null)
  useWordmarkTint(headingRef, lead, tail, oneLine)

  return (
    <section className="dark relative isolate flex min-h-[clamp(300px,40svh,520px)] overflow-hidden">
      {/* `<source>`, so a browser can reject a codec before spending a request
          and further encodes drop in above this line. `preload="auto"` because
          `autoPlay` overrides `preload` anyway. */}
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

      {/* Scrim, brand glow, then a fade to `--psl-page` — the same #040811 the
          page paints below, which is why the band needs no bottom border. */}
      <div className="absolute inset-0 bg-page/65" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_-20%,color-mix(in_oklab,var(--psl-accent)_22%,transparent),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-page" />

      {/* `py` is the only lever on a short screen — the wordmark's SVG box is a
          fixed multiple of its font size, so the content is the real floor. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-16">
        {children ?? (
          /* Keyed on the language: StrokeText animates on mount and caches its
             measured viewBox, so a remount is what replays the draw and
             re-measures for the new copy. */
          <Fragment key={i18n.language}>
            {/* `wordmark-draw` holds the fill at opacity 0 until GSAP takes over,
                so the headline cannot paint solid before the measurement lands. */}
            <h1 ref={headingRef} aria-label={wordmark} className="wordmark-draw w-full">
              {oneLine ? (
                /* ONE component, and it must stay one: one component is one GSAP
                   timeline, which is what makes the draw a single sweep. Both
                   colours are the accent; `useWordmarkTint` repaints the lead. */
                <StrokeText
                  {...DRAW}
                  style={WORDMARK_FONT}
                  text={wordmark}
                  strokeColor={ACCENT_COLOR}
                  fillColor={ACCENT_COLOR}
                />
              ) : (
                /* Two lines, the one place two components are correct — separate
                   rows, so the parallel timelines do not read as one line.
                   `!h-auto` overrides StrokeText's fixed `fontSize × 1.3` box;
                   width is then the only size control, hence `w-[85%]` and the
                   per-line share. Both go on StrokeText's own root, since
                   `[&>span>svg]` matches one level down and a wrapper escapes it. */
                <span className="mx-auto block w-[85%] [&>span>svg]:!h-auto">
                  <StrokeText
                    {...DRAW}
                    className="mx-auto"
                    style={{ ...WORDMARK_FONT, width: stackedShare(leadUnits, tailUnits) }}
                    text={lead}
                    strokeColor={LEAD_COLOR}
                    fillColor={LEAD_COLOR}
                  />
                  {/* `-mt-2` pulls back the viewBox padding baked into each svg,
                      which no `gap` can reach. Don't push it much further: that
                      padding also keeps the stroke off the viewBox edge. */}
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
            {/* Held until the draw lands, then two beats 0.14s apart so the lines
                arrive in reading order. The delay collapses under reduced motion,
                where StrokeText has already jumped to its end state. */}
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
