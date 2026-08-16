import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { CONCIERGE_PHONE, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/shared/config/contact'
import { ConciergeSection } from '../components/landing/ConciergeSection'

describe('ConciergeSection', () => {
  it('offers the AI line as a button rather than a link', () => {
    render(<ConciergeSection />)

    expect(
      screen.getByRole('button', { name: new RegExp(`call scout at`, 'i') }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: new RegExp(CONCIERGE_PHONE.replace(/[+()]/g, '\\$&')) }),
    ).not.toBeInTheDocument()
  })

  it('keeps the human number a working tel: link', () => {
    render(<ConciergeSection />)

    const human = screen.getByRole('link', { name: CONTACT_PHONE })
    expect(human).toHaveAttribute('href', CONTACT_PHONE_HREF)
  })

  it('routes the AI and the humans to separate numbers', () => {
    expect(CONCIERGE_PHONE).not.toBe(CONTACT_PHONE)
  })

  it('answers the call request with the invitation', async () => {
    render(<ConciergeSection />)

    await userEvent.click(screen.getByRole('button', { name: /call scout/i }))

    expect(await screen.findByText(/we can make it true/i)).toBeInTheDocument()
  })

  it('hides the voice equaliser from assistive technology', () => {
    render(<ConciergeSection />)

    // Decorative and role-less, so it is reachable only by attribute — the
    // documented exception. Anchored on the live-status row it belongs to.
    const status = screen.getByText(/scout is available now/i).parentElement
    expect(status?.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})
