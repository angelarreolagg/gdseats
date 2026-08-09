import { render, screen, setViewport } from '@/test/utils'
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
    expect(video).toHaveAttribute('src', '/nflstadiums.mp4')
    // React reflects `muted` as a DOM property only — there is no attribute to read.
    expect(video?.muted).toBe(true)
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveAttribute('aria-hidden', 'true')
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
   * Validates: the first 10 glyphs really are "SOME SEATS".
   * Why it matters: the two-tone wordmark is split by character index in
   * `globals.css` (`:nth-child(-n + 10)`), because StrokeText paints one colour
   * per string. CSS cannot read the copy, so rewriting the headline without
   * moving that number would cut the tint mid-word — and nothing else would
   * complain. This is the only thing holding the two together.
   */
  it('keeps the tinted half aligned with the copy', () => {
    const { container } = render(<TeamsHero />)

    const glyphs = Array.from(container.querySelectorAll('[data-stroke-char]'))
    expect(glyphs.map((glyph) => glyph.textContent).join('')).toBe('SOME SEATS MEAN MORE')
    expect(
      glyphs
        .slice(0, 10)
        .map((glyph) => glyph.textContent)
        .join(''),
    ).toBe('SOME SEATS')

    expect(container.querySelector('h1')).toHaveClass('hero-wordmark')
  })

  /**
   * Validates: the demo disclosure is visible text, not a hover affordance.
   * Why it matters: "these prices are invented" is the one claim a visitor has to
   * be able to read before they trust anything below it. The header states it too,
   * but only inside a tooltip — and hover tooltips never fire on touch, so on a
   * phone that version does not exist. If this chip ever became a tooltip, an
   * entire class of device would browse a mock marketplace with no indication it
   * was one.
   */
  it('states the demo disclosure as visible copy', () => {
    render(<TeamsHero />)

    expect(screen.getByText(/demo version .* all data is mocked/i)).toBeInTheDocument()
  })

  /**
   * Validates: the disclosure reads before the value proposition.
   * Why it matters: the three lines fade in on separate beats, and the order is
   * the point — a visitor who reads "the easy, transparent and secure way to buy"
   * before learning it is a demo has been told something untrue for as long as the
   * gap lasts. DOM order is what both a screen reader and the cascade follow, so
   * pinning it here is what keeps the sequence honest.
   */
  it('places the disclosure above the value proposition', () => {
    render(<TeamsHero />)

    const disclosure = screen.getByText(/demo version .* all data is mocked/i)
    const promise = screen.getByText(/find your team's psl & tickets/i)

    // Node.compareDocumentPosition: FOLLOWING means `promise` comes after.
    expect(disclosure.compareDocumentPosition(promise)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
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
   * Validates: the two-line branch does NOT rely on the `nth-child(-n + 10)`
   * tint, and the one-line branch still does.
   * Why it matters: the CSS split counts glyphs, and the count is hard-coded to
   * the current copy. Carrying that coupling onto a layout that does not need it
   * would double the number of places a rewritten headline can silently cut the
   * tint mid-word. Each narrow line paints its own colour from its own component.
   */
  it('drops the glyph-count tint on the split layout', () => {
    setViewport('mobile')
    const { container: narrow } = render(<TeamsHero />)
    expect(narrow.querySelector('h1')).not.toHaveClass('hero-wordmark')

    setViewport('desktop')
    const { container: wide } = render(<TeamsHero />)
    expect(wide.querySelector('h1')).toHaveClass('hero-wordmark')
  })

  /**
   * Validates: both wordmark branches carry the class that holds the fill back
   * until the draw owns it.
   * Why it matters: StrokeText's `wipe` mode leaves the fill at full opacity and
   * hides it with a clipPath that does not exist until getBBox() resolves — and
   * TeamsHero paints the stroke in the same colour as the fill. Without this
   * class the headline lands solid and the whole draw is invisible, which is the
   * bug this fixed. It is easy to lose because the tint above it is deliberately
   * one-branch-only, so the two look like they should match and do not.
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
