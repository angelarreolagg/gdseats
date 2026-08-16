import { render, screen, setLocale, setViewport } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { TeamsHero } from '../components/TeamsHero'

describe('TeamsHero', () => {
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

  it('loads the footage from a fingerprinted asset import', () => {
    const { container } = render(<TeamsHero />)

    const source = container.querySelector('video source')
    expect(source).not.toBeNull()
    // Vite resolves the import to a real path; in test it stays under /src/assets.
    expect(source?.getAttribute('src')).toMatch(/hero-stadiums.*\.mp4$/)
    expect(source?.getAttribute('src')).not.toMatch(/^\/nflstadiums/)
  })

  it('declares the codec its encode actually uses', () => {
    const { container } = render(<TeamsHero />)

    expect(container.querySelector('video source')).toHaveAttribute(
      'type',
      'video/mp4; codecs="avc1.640028"',
    )
  })

  it('keeps the accent gradient over the footage', () => {
    const { container } = render(<TeamsHero />)

    const glow = container.querySelector('[class*="radial-gradient"]')
    expect(glow?.className).toContain('var(--psl-accent)')
  })

  it('holds the dark palette regardless of theme', () => {
    const { container } = render(<TeamsHero />)

    expect(container.querySelector('section')).toHaveClass('dark')
  })

  it('names the drawn headline and keeps the copy below it as text', () => {
    render(<TeamsHero />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'SOME SEATS MEAN MORE' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/find your team's psl & tickets/i)).toBeInTheDocument()
    expect(screen.getByText(/buy and sell personal seat licenses/i)).toBeInTheDocument()
  })

  it('draws the wide headline as a single component', () => {
    const { container } = render(<TeamsHero />)

    const drawn = container.querySelectorAll('h1 [role="img"]')
    expect(drawn).toHaveLength(1)
    expect(drawn[0]).toHaveAttribute('aria-label', 'SOME SEATS MEAN MORE')
  })

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

  it('moves the tint boundary with the language', () => {
    setLocale('ja')
    const { container } = render(<TeamsHero />)

    const tinted = Array.from(container.querySelectorAll<SVGTSpanElement>('[data-stroke-char]'))
      .filter((glyph) => glyph.style.stroke !== '')
      .map((glyph) => glyph.textContent)
      .join('')

    expect(tinted).toBe('その席には')
  })

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

  it('carries CJK coverage in the wordmark font stack', () => {
    const { container } = render(<TeamsHero />)

    const font = (container.querySelector('h1 [role="img"]') as HTMLElement).style.fontFamily
    expect(font).toMatch(/Helvetica/)
    expect(font).toMatch(/Hiragino Sans|Yu Gothic|Noto Sans JP/)
  })

  // StrokeText hides the fill only once getBBox() has resolved; this class
  // covers the frames before that.
  it('gates the wordmark fill on the draw at both widths', () => {
    setViewport('mobile')
    const { container: narrow } = render(<TeamsHero />)
    expect(narrow.querySelector('h1')).toHaveClass('wordmark-draw')

    setViewport('desktop')
    const { container: wide } = render(<TeamsHero />)
    expect(wide.querySelector('h1')).toHaveClass('wordmark-draw')
  })

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
