import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { SELL_EMAIL, SELL_EMAIL_HREF } from '@/shared/config/contact'
import { SellCtaSection } from '../components/landing/SellCtaSection'

describe('SellCtaSection', () => {
  /**
   * Validates: "Start selling" is a button that answers, not a link to nowhere.
   * Why it matters: this is the loudest control on the landing page and the one a
   * seller reaches on purpose. An `<a href="#">` would promise navigation to a
   * screen reader and deliver a scroll to the top; a button that says why it can't
   * proceed is the difference between reading as a demo and reading as broken.
   */
  it('answers the sell CTA with the invitation', async () => {
    render(<SellCtaSection />)

    const cta = screen.getByRole('button', { name: /start selling/i })
    expect(cta).toBeInTheDocument()

    await userEvent.click(cta)

    expect(await screen.findByText(/we can make it true/i)).toBeInTheDocument()
  })

  /**
   * Validates: the email fallback is a genuine `mailto:` anchor, pointed at the
   * sell-side address rather than general support.
   * Why it matters: with the CTA deliberately inert, this is the only control in
   * the band that actually does something — `mailto:` needs no backend. Demoting
   * it to a button would leave a seller with no way to make contact at all, and
   * pointing it at the support inbox is how a "we handle bulk sales" promise turns
   * into a week of silence.
   */
  it('keeps the email a working mailto: link to the sell inbox', () => {
    render(<SellCtaSection />)

    expect(screen.getByRole('link', { name: SELL_EMAIL })).toHaveAttribute(
      'href',
      SELL_EMAIL_HREF,
    )
  })

  /**
   * Validates: the band follows the active theme instead of pinning a palette.
   * Why it matters: it shipped carrying the `dark` class, and in light mode that
   * rendered a near-black slab dropped into a near-white document — read as a
   * rendering fault rather than as emphasis. The two surfaces that legitimately
   * pin dark have reasons this one lacks: `AppHeader`'s bright-green mark would
   * be swallowed by a light bar, and `TeamsHero`'s type sits on dark footage.
   * Re-adding the class here is a one-word change that looks harmless and breaks
   * light mode outright, so it is worth a test of its own.
   */
  it('follows the theme rather than pinning a palette', () => {
    const { container } = render(<SellCtaSection />)

    expect(container.querySelector('section')).not.toHaveClass('dark')
  })
})
