import { render, screen, setLocale, setViewport } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { TeamsHero } from '../components/TeamsHero'

describe('TeamsHero', () => {
  /**
   * Validates: the backdrop is muted, looping, inline footage that no screen
   * reader announces.
   * Why it matters: a landing page that starts making noise is the single
   * fastest way to lose a visitor, and on iOS a video without `playsInline`
   * hijacks the screen into the native fullscreen player — the first impression
   * of the product would be a video controls bar.
   */
  it('renders the stadium footage silently', () => {
    const { container } = render(<TeamsHero />)

    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    // React reflects `muted` as a DOM property only — there is no attribute to read.
    expect(video?.muted).toBe(true)
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveAttribute('aria-hidden', 'true')
  })

  /**
   * Validates: the footage is an imported (therefore fingerprinted) asset, not a
   * path typed into `public/`.
   * Why it matters: only a content-hashed filename can safely be served
   * `immutable`, which is what `vercel.json` grants `/assets/*` and what makes a
   * repeat visit cost zero bytes. Moving the file back to `public/` for
   * convenience would keep the hero working perfectly in dev and quietly cost
   * every returning visitor a fresh 6 MB revalidation — nothing else would fail.
   */
  it('loads the footage from a fingerprinted asset import', () => {
    const { container } = render(<TeamsHero />)

    const source = container.querySelector('video source')
    expect(source).not.toBeNull()
    // Vite resolves the import to a real path; in test it stays under /src/assets.
    expect(source?.getAttribute('src')).toMatch(/hero-stadiums.*\.mp4$/)
    expect(source?.getAttribute('src')).not.toMatch(/^\/nflstadiums/)
  })

  /**
   * Validates: the source declares the exact codec of the file we ship.
   * Why it matters: a browser that cannot decode the advertised codec skips the
   * `<source>` **silently** — no error, no event. With a single source that means
   * an empty hero and no signal anywhere that something broke. The string was read
   * out of the file's `avcC` box (High profile, level 4.0); a re-encode that
   * changes the profile without updating it here would black out the band on
   * whichever engines are strictest, which is the hardest kind of bug to notice.
   */
  it('declares the codec its encode actually uses', () => {
    const { container } = render(<TeamsHero />)

    expect(container.querySelector('video source')).toHaveAttribute(
      'type',
      'video/mp4; codecs="avc1.640028"',
    )
  })

  /**
   * Validates: the brand glow survived the move to video.
   * Why it matters: the green radial was the entire hero before the footage
   * existed, and it is what makes the band read as this product rather than as
   * stock stadium B-roll. It is easy to mistake for a leftover of the old design
   * and delete while "cleaning up" the new one.
   */
  it('keeps the accent gradient over the footage', () => {
    const { container } = render(<TeamsHero />)

    const glow = container.querySelector('[class*="radial-gradient"]')
    expect(glow?.className).toContain('var(--psl-accent)')
  })

  /**
   * Validates: the hero pins the dark palette in both themes.
   * Why it matters: the type sits on stadium footage that is dark whichever
   * theme the user picked. Without this class, light mode resolves `text-ink` to
   * near-black and the headline disappears into the video.
   */
  it('holds the dark palette regardless of theme', () => {
    const { container } = render(<TeamsHero />)

    expect(container.querySelector('section')).toHaveClass('dark')
  })

  /**
   * Validates: the drawn wordmark carries a real accessible name, and the copy
   * below it survives as text.
   * Why it matters: the headline is SVG glyph outlines — to a screen reader it
   * is a picture, and without the label the page's only `<h1>` announces
   * nothing. The two lines under it are the actual value proposition, so they
   * stay as selectable, translatable text rather than joining the artwork.
   */
  it('names the drawn headline and keeps the copy below it as text', () => {
    render(<TeamsHero />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'SOME SEATS MEAN MORE' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/find your team's psl & tickets/i)).toBeInTheDocument()
    expect(screen.getByText(/buy and sell personal seat licenses/i)).toBeInTheDocument()
  })

  /**
   * Validates: the wide headline is ONE StrokeText drawing the whole phrase.
   * Why it matters: one component is one GSAP timeline, and that is the only
   * thing making the draw read as a single left-to-right sweep. Splitting the
   * phrase into two components makes the two-tone trivial and animates the halves
   * simultaneously — which looks correct in a screenshot and reads as two
   * separate texts in motion. That regression shipped once; this is what stops it
   * coming back the next time someone wants the tint to be simpler.
   */
  it('draws the wide headline as a single component', () => {
    const { container } = render(<TeamsHero />)

    const drawn = container.querySelectorAll('h1 [role="img"]')
    expect(drawn).toHaveLength(1)
    expect(drawn[0]).toHaveAttribute('aria-label', 'SOME SEATS MEAN MORE')
  })

  /**
   * Validates: the two-tone split follows the copy, not a hard-coded count.
   * Why it matters: this replaced `:nth-child(-n + 10)` in `globals.css`, a count
   * tied to "SOME SEATS" that CSS could not derive and that a rewritten headline
   * cut mid-word. The headline is translated now, so that rule would be wrong in
   * three languages at once. The tint is applied from `lead.length` instead —
   * imperatively, because the alternative that avoids the DOM is the two-component
   * split that breaks the animation.
   */
  it('tints exactly the lead glyphs, in whatever language', () => {
    const { container } = render(<TeamsHero />)

    const strokes = Array.from(container.querySelectorAll<SVGTSpanElement>('[data-stroke-char]'))
    expect(strokes.map((glyph) => glyph.textContent).join('')).toBe('SOME SEATS MEAN MORE')

    const tinted = strokes.filter((glyph) => glyph.style.stroke !== '')
    expect(tinted.map((glyph) => glyph.textContent).join('')).toBe('SOME SEATS')

    // And the fill copy of the same glyphs, or the wipe would reveal one colour
    // over a stroke drawn in another.
    const fills = Array.from(container.querySelectorAll<SVGTSpanElement>('[data-fill-char]'))
    expect(
      fills
        .filter((glyph) => glyph.style.fill !== '')
        .map((glyph) => glyph.textContent)
        .join(''),
    ).toBe('SOME SEATS')
  })

  /**
   * Validates: the tint count moves with the copy.
   * Why it matters: this is the whole reason the CSS rule had to go. A count that
   * does not follow the language paints part of the second clause in the lead
   * colour, or leaves part of the first on the accent — a headline that looks
   * subtly wrong in exactly the locales nobody re-reads.
   */
  it('moves the tint boundary with the language', () => {
    setLocale('ja')
    const { container } = render(<TeamsHero />)

    const tinted = Array.from(container.querySelectorAll<SVGTSpanElement>('[data-stroke-char]'))
      .filter((glyph) => glyph.style.stroke !== '')
      .map((glyph) => glyph.textContent)
      .join('')

    expect(tinted).toBe('その席には')
  })

  /**
   * Validates: on a narrow screen the wordmark is two drawn lines, and the
   * heading still announces the whole phrase.
   * Why it matters: StrokeText scales its artwork to the width it is given, so at
   * 350px the single line renders as a ~32px ribbon adrift in a 166px box — the
   * headline of the landing page, illegible. Splitting it is the fix, and the
   * accessible name has to survive the split: the `<h1>` is the only `<h1>` on
   * the page, and it must not start announcing half a sentence.
   */
  it('splits the wordmark into two drawn lines on a narrow screen', () => {
    setViewport('mobile')
    const { container } = render(<TeamsHero />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'SOME SEATS MEAN MORE' }),
    ).toBeInTheDocument()

    const lines = container.querySelectorAll('h1 [role="img"]')
    expect(lines).toHaveLength(2)
    expect(Array.from(lines).map((line) => line.getAttribute('aria-label'))).toEqual([
      'SOME SEATS',
      'MEAN MORE',
    ])
  })

  /**
   * Validates: the wordmark is translated, and the `<h1>` announces the whole
   * translated phrase.
   * Why it matters: the headline is SVG glyph outlines, so the accessible name is
   * the only thing a screen reader gets — and it is assembled from the two halves
   * here rather than left to their concatenation. That matters most in Japanese,
   * which writes no space between the halves: without an explicit separator the
   * page's only `<h1>` would announce the two clauses run together.
   */
  it('translates the wordmark and names the whole phrase', () => {
    setLocale('ja')
    const { container } = render(<TeamsHero />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'その席には 意味がある' }),
    ).toBeInTheDocument()

    // The separator is explicit: Japanese writes no space between the two
    // clauses, so a name built by concatenating children would run them together.
    const glyphs = Array.from(container.querySelectorAll('[data-stroke-char]'))
      .map((glyph) => glyph.textContent)
      .join('')
    expect(glyphs).toBe('その席には 意味がある')
  })

  /**
   * Validates: the wordmark's font stack can actually draw the copy it is given.
   * Why it matters: `StrokeText` strokes glyph outlines, so the face matters more
   * here than anywhere else in the app — the Latin stack was chosen because SF
   * Pro's overlapping contours render as loose slivers when stroked. None of
   * Helvetica/Arial has CJK coverage, so translating the headline without
   * extending the stack would hand Japanese to whatever the browser picked, with
   * no one having looked at it. Fallback is per glyph, so the Latin locales are
   * untouched by the additions.
   */
  it('carries CJK coverage in the wordmark font stack', () => {
    const { container } = render(<TeamsHero />)

    const font = (container.querySelector('h1 [role="img"]') as HTMLElement).style.fontFamily
    expect(font).toMatch(/Helvetica/)
    expect(font).toMatch(/Hiragino Sans|Yu Gothic|Noto Sans JP/)
  })

  /**
   * Validates: both wordmark branches carry the class that holds the fill back
   * until the draw owns it.
   * Why it matters: StrokeText's `wipe` mode leaves the fill at full opacity and
   * hides it with a clipPath that does not exist until getBBox() resolves — and
   * TeamsHero paints the stroke in the same colour as the fill. Without this
   * class the headline lands solid and the whole draw is invisible, which is the
   * bug this fixed. It now sits on the `<h1>` and covers both layouts, where the
   * two-tone tint it used to sit beside has become a prop on each half.
   */
  it('gates the wordmark fill on the draw at both widths', () => {
    setViewport('mobile')
    const { container: narrow } = render(<TeamsHero />)
    expect(narrow.querySelector('h1')).toHaveClass('wordmark-draw')

    setViewport('desktop')
    const { container: wide } = render(<TeamsHero />)
    expect(wide.querySelector('h1')).toHaveClass('wordmark-draw')
  })

  /**
   * Validates: the headline slot replaces the built-in copy rather than stacking
   * with it.
   * Why it matters: the backdrop and the title ship separately — a bespoke title
   * component has to be able to take over the slot without the default copy
   * showing through underneath it.
   */
  it('yields the slot to a supplied headline', () => {
    const { unmount } = render(<TeamsHero />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    unmount()

    render(
      <TeamsHero>
        <h1>Custom headline</h1>
      </TeamsHero>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Custom headline')
    expect(screen.queryByText(/find your team's psl/i)).not.toBeInTheDocument()
  })
})
