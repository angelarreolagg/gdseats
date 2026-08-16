import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { SELL_EMAIL, SELL_EMAIL_HREF } from '@/shared/config/contact'
import { SellCtaSection } from '../components/landing/SellCtaSection'

describe('SellCtaSection', () => {
  it('answers the sell CTA with the invitation', async () => {
    render(<SellCtaSection />)

    const cta = screen.getByRole('button', { name: /start selling/i })
    expect(cta).toBeInTheDocument()

    await userEvent.click(cta)

    expect(await screen.findByText(/we can make it true/i)).toBeInTheDocument()
  })

  it('keeps the email a working mailto: link to the sell inbox', () => {
    render(<SellCtaSection />)

    expect(screen.getByRole('link', { name: SELL_EMAIL })).toHaveAttribute(
      'href',
      SELL_EMAIL_HREF,
    )
  })

  it('follows the theme rather than pinning a palette', () => {
    const { container } = render(<SellCtaSection />)

    expect(container.querySelector('section')).not.toHaveClass('dark')
  })
})
