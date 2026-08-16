import { render } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { SymmetricWave } from '../components/landing/SymmetricWave'

describe('SymmetricWave', () => {
  it('renders a still silhouette under reduced motion', () => {
    const { container } = render(<SymmetricWave />)

    // Decorative, role-less and unlabelled by design, so no RTL query can reach
    // it — the documented querySelector exception.
    const bars = container.querySelectorAll('span > span')

    expect(bars).toHaveLength(9)
    bars.forEach((bar) => {
      expect((bar as HTMLElement).style.height).not.toBe('')
    })
  })

  it('mirrors the bar heights around the centre', () => {
    const { container } = render(<SymmetricWave />)

    const heights = Array.from(container.querySelectorAll('span > span')).map(
      (bar) => (bar as HTMLElement).style.height,
    )

    expect(heights).toEqual([...heights].reverse())
    // Centre is the tallest: the ends start together and the pulse meets in the
    // middle, which is what makes it read as a voice rather than as progress.
    expect(heights[4]).toBe('24px')
  })

  it('stays out of the accessibility tree', () => {
    const { container } = render(<SymmetricWave />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
