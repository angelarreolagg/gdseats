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

  /**
   * Validates: the card starts unlit and lights up under the pointer.
   * Why it matters: the glow is the entire point of using this card over a plain
   * one, and its resting state has to be *off* — three cards glowing at once
   * would read as three selected states on a page whose accent means "active".
   * The opacity is driven from React state, so a refactor that drops the handlers
   * leaves a card that looks right in a screenshot and does nothing on a real
   * pointer.
   */
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

  /**
   * Validates: the glow follows the pointer rather than sitting at a fixed spot.
   * Why it matters: the tracking is what makes it a spotlight instead of a static
   * corner wash. jsdom reports a zero-sized rect, so the assertion is that the
   * gradient's origin *moves with the event* — which is the part a refactor can
   * silently drop while the card still lights up on hover.
   */
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

  /**
   * Validates: the glow layer is hidden from assistive technology.
   * Why it matters: it encodes nothing — a touch device never fires `mousemove`
   * and so never sees it at all, which is exactly why nothing may depend on it.
   * Announcing an empty decorative div inside every pillar would add three nodes
   * of noise to the section's reading order for no gain.
   */
  it('keeps the glow out of the accessibility tree', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Body</p>
      </SpotlightCard>,
    )

    expect(glowOf(container)).not.toBeNull()
  })

  /**
   * Validates: the default spotlight is the themed accent, not a hard-coded rgba.
   * Why it matters: upstream ships `rgba(255, 255, 255, 0.25)`, which is invisible
   * on this app's light surface and ignores the theme entirely. The whole palette
   * here resolves through custom properties, and a literal colour would be the one
   * hue on the page that does not — the reason the prop's type was widened at all.
   */
  it('defaults the spotlight to the themed brand accent', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Body</p>
      </SpotlightCard>,
    )

    expect(glowOf(container)?.style.background).toContain('var(--psl-accent)')
  })
})
