import { fireEvent, render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { SpotlightCard } from '../components/SpotlightCard'

/** The glow layer has no role and no name by design — this is the documented
 *  querySelector exception for a purely decorative element. */
const glowOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('div > div[aria-hidden="true"]')

describe('SpotlightCard', () => {
  it('renders its children', () => {
    render(
      <SpotlightCard>
        <h3>Secure</h3>
      </SpotlightCard>,
    )

    expect(screen.getByRole('heading', { name: 'Secure' })).toBeInTheDocument()
  })

  it('raises the glow on hover and drops it on leave', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Body</p>
      </SpotlightCard>,
    )
    const card = container.firstElementChild as HTMLElement

    expect(glowOf(container)?.style.opacity).toBe('0')

    fireEvent.mouseEnter(card)
    expect(glowOf(container)?.style.opacity).toBe('0.6')

    fireEvent.mouseLeave(card)
    expect(glowOf(container)?.style.opacity).toBe('0')
  })

  // jsdom reports a zero-sized rect, so this pins that the custom properties
  // are written, not what they resolve to.
  it('moves the gradient origin with the pointer', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Body</p>
      </SpotlightCard>,
    )
    const card = container.firstElementChild as HTMLElement

    fireEvent.mouseEnter(card)
    fireEvent.mouseMove(card, { clientX: 120, clientY: 40 })

    // getBoundingClientRect is all zeros in jsdom, so clientX/Y pass through.
    expect(glowOf(container)?.style.background).toContain('120px 40px')
  })

  it('keeps the glow out of the accessibility tree', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Body</p>
      </SpotlightCard>,
    )

    expect(glowOf(container)).not.toBeNull()
  })

  it('defaults the spotlight to the themed brand accent', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Body</p>
      </SpotlightCard>,
    )

    expect(glowOf(container)?.style.background).toContain('var(--psl-accent)')
  })
})
