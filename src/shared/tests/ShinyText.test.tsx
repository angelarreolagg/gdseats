import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { ShinyText } from '../components/ShinyText'

describe('ShinyText', () => {
  /**
   * Validates: the glyphs stay real, selectable text.
   * Why it matters: this is the difference between `ShinyText` and the hero's
   * `StrokeText`. The hero draws SVG outlines and has to declare `role="img"`
   * plus an `aria-label` to have a name at all; this paints ordinary text with a
   * clipped gradient, so it stays selectable, translatable, and findable by
   * in-page search. A heading that quietly became a picture would take its
   * accessible name with it.
   */
  it('keeps the shined string as real text', () => {
    render(<ShinyText text="G&D Seats" />)

    expect(screen.getByText('G&D Seats')).toBeInTheDocument()
  })

  /**
   * Validates: the sweep parks off-screen instead of running, under reduced
   * motion.
   * Why it matters: `useAnimationFrame` is a raw frame loop, so
   * `MotionConfig reducedMotion="user"` never sees it — without the hand-rolled
   * gate the highlight would sweep forever at precisely the person who asked the
   * system to stop things moving. `150% center` is the parked position, which
   * renders the flat base colour; any other value means it froze mid-sweep, which
   * would leave the heading painted in a half-gradient.
   */
  it('parks the highlight when the visitor asked for no motion', () => {
    render(<ShinyText text="G&D Seats" />)

    // The span carries no role and no name of its own — the documented
    // querySelector exception for reading back a decorative paint state.
    const span = screen.getByText('G&D Seats')
    expect(span.style.backgroundPosition).toBe('150% center')
  })

  /**
   * Validates: the default colours are the theme tokens, not upstream's hexes.
   * Why it matters: React Bits ships `#b5b5b5` and `#ffffff`, which would paint
   * one fixed grey in both themes and ignore the palette entirely — and because
   * the text fill is transparent, that gradient is the *only* thing colouring the
   * glyphs, so a `text-*` utility could not rescue it. The shine token also
   * inverts by mode (darker in light, lighter in dark) to hold contrast, which
   * only works if these defaults are `var()` references.
   */
  it('paints from the theme tokens by default', () => {
    render(<ShinyText text="G&D Seats" />)

    const background = screen.getByText('G&D Seats').style.backgroundImage
    expect(background).toContain('var(--psl-accent-ink)')
    expect(background).toContain('var(--psl-accent-shine)')
  })

  /**
   * Validates: the text fill is transparent so the gradient shows through.
   * Why it matters: `background-clip: text` only reveals the gradient when the
   * fill is transparent. Lose that one declaration and the element paints solid
   * over its own gradient — the shine is still animating underneath, perfectly
   * invisible, which is the hardest version of this bug to spot.
   */
  it('clips the gradient to the glyphs', () => {
    render(<ShinyText text="G&D Seats" />)

    const span = screen.getByText('G&D Seats')
    expect(span.style.backgroundClip).toBe('text')
    expect(span.style.webkitTextFillColor).toBe('transparent')
  })
})
