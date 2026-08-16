import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from '@/shared/config/contact'
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
   * Validates: the email fallback is a genuine `mailto:` anchor.
   * Why it matters: with the CTA deliberately inert, this is the only control in
   * the band that actually does something — `mailto:` needs no backend. Demoting
   * it to a button alongside the others would leave a seller with no way to make
   * contact at all.
   */
  it('keeps the email a working mailto: link', () => {
    render(<SellCtaSection />)

    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      CONTACT_EMAIL_HREF,
    )
  })

  /**
   * Validates: the band pins the dark palette regardless of the active theme.
   * Why it matters: this is one of three surfaces in the app that opts out of the
   * theme, and the class is the entire mechanism — the palette is nothing but
   * custom properties scoped to `.dark`, so removing it does not merely lighten
   * the band, it re-resolves every token inside and leaves near-white text on a
   * near-white ground. It looks like a stray class during a cleanup, which is
   * exactly why it is pinned.
   */
  it('holds the dark palette in both themes', () => {
    const { container } = render(<SellCtaSection />)

    expect(container.querySelector('section')).toHaveClass('dark')
  })
})
