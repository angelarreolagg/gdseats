import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { ShinyText } from '../components/ShinyText'

describe('ShinyText', () => {
  it('keeps the shined string as real text', () => {
    render(<ShinyText text="G&D Seats" />)

    expect(screen.getByText('G&D Seats')).toBeInTheDocument()
  })

  it('parks the highlight when the visitor asked for no motion', () => {
    render(<ShinyText text="G&D Seats" />)

    // The span carries no role and no name of its own — the documented
    // querySelector exception for reading back a decorative paint state.
    const span = screen.getByText('G&D Seats')
    expect(span.style.backgroundPosition).toBe('150% center')
  })

  it('paints from the theme tokens by default', () => {
    render(<ShinyText text="G&D Seats" />)

    const background = screen.getByText('G&D Seats').style.backgroundImage
    expect(background).toContain('var(--psl-accent-ink)')
    expect(background).toContain('var(--psl-accent-shine)')
  })

  it('clips the gradient to the glyphs', () => {
    render(<ShinyText text="G&D Seats" />)

    const span = screen.getByText('G&D Seats')
    expect(span.style.backgroundClip).toBe('text')
    expect(span.style.webkitTextFillColor).toBe('transparent')
  })
})
