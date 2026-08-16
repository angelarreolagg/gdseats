import { render, screen, waitFor } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { TheGDWaySection } from '../components/landing/TheGDWaySection'

describe('TheGDWaySection', () => {
  /**
   * Validates: the heading announces as one sentence, brand words included.
   * Why it matters: "G&D Seats" is rendered by `ShinyText`, which wraps it in its
   * own `inline-block` span and paints it with a clipped gradient. That is a
   * colouring technique, not a picture — so unlike the hero's `StrokeText` it must
   * need no `aria-label` and must not fragment the name. If this section's only
   * heading ever announced as "The way", the brand would have vanished from the
   * page's outline while looking perfect on screen.
   */
  it('announces the heading as one sentence', () => {
    render(<TheGDWaySection />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'The G&D Seats way' }),
    ).toBeInTheDocument()
  })

  it('states all three pillars', () => {
    render(<TheGDWaySection />)

    expect(screen.getByRole('heading', { level: 3, name: 'Secure' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Easy to use' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Transparent' })).toBeInTheDocument()
  })

  /**
   * Validates: the viewport reveal actually fires, lifting content off the
   * `opacity: 0` it starts from.
   * Why it matters: this is the first viewport-triggered animation in the app and
   * its failure mode is silent — the markup is complete and every content
   * assertion still passes while the section renders as blank space. jsdom has no
   * `IntersectionObserver`, so `whileInView` only ever resolves because
   * `src/test/setup.ts` stubs one; remove that stub and every landing section is
   * invisible, with this the only test that notices.
   *
   * `waitFor`, not a synchronous assertion: the trigger is what is being pinned,
   * and it is observable the instant opacity leaves zero — long before the 0.7s
   * fade finishes. Waiting for the animation to *complete* would be pinning a
   * duration, which this suite deliberately never does.
   */
  it('lifts revealed content off transparent', async () => {
    render(<TheGDWaySection />)
    const pillar = screen.getByRole('heading', { level: 3, name: 'Secure' })

    await waitFor(() => {
      expect(pillar).toBeVisible()
    })
  })

  /**
   * Validates: the pillar medallions are hidden from assistive technology.
   * Why it matters: the icon repeats what the heading beside it already says, so
   * exposing it would make a screen reader announce each pillar twice. The heading
   * is the label; the shield is decoration.
   */
  it('hides the pillar icons from assistive technology', () => {
    const { container } = render(<TheGDWaySection />)

    // The icons are decorative: no role, no accessible name, so no RTL query can
    // reach them. This is the documented exception for querySelector.
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(3)
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
