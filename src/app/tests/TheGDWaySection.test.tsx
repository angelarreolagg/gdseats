import { render, screen, waitFor } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { TheGDWaySection } from '../components/landing/TheGDWaySection'

describe('TheGDWaySection', () => {
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

  // Needs the IntersectionObserver stub in src/test/setup.ts: without it every
  // Reveal stays at opacity 0 and only this assertion notices.
  it('lifts revealed content off transparent', async () => {
    render(<TheGDWaySection />)
    const pillar = screen.getByRole('heading', { level: 3, name: 'Secure' })

    await waitFor(() => {
      expect(pillar).toBeVisible()
    })
  })

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
