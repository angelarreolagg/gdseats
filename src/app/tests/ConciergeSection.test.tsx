import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { describe, expect, it } from 'vitest'
import { CONCIERGE_PHONE, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/shared/config/contact'
import { ConciergeSection } from '../components/landing/ConciergeSection'

describe('ConciergeSection', () => {
  /**
   * Validates: the concierge CTA is a button, not a `tel:` link.
   * Why it matters: there is no AI on the other end of that number. A link tells a
   * screen reader that Enter will place a call, and on a phone it would really try
   * — the visitor dials a dead line and concludes the product is broken rather
   * than unbuilt. The dead-chrome rule exists for exactly this, and a `tel:`
   * anchor is the most tempting way to break it, because it *looks* like the
   * honest markup.
   */
  it('offers the AI line as a button rather than a link', () => {
    render(<ConciergeSection />)

    expect(
      screen.getByRole('button', { name: new RegExp(`call scout at`, 'i') }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: new RegExp(CONCIERGE_PHONE.replace(/[+()]/g, '\\$&')) }),
    ).not.toBeInTheDocument()
  })

  /**
   * Validates: the human fallback is a real `tel:` anchor pointing at the shared
   * house number.
   * Why it matters: it is the one contact on this card that works without a
   * backend, and it is the escape hatch for anyone who does not want to talk to a
   * machine. Reading it from `shared/config/contact` is what stops this number and
   * the footer's from drifting apart — a marketplace listing two different numbers
   * for itself reads as a scam.
   */
  it('keeps the human number a working tel: link', () => {
    render(<ConciergeSection />)

    const human = screen.getByRole('link', { name: CONTACT_PHONE })
    expect(human).toHaveAttribute('href', CONTACT_PHONE_HREF)
  })

  /**
   * Validates: the AI line and the human line are different numbers.
   * Why it matters: the two are presented as different routes — one a button that
   * explains the demo, one a link that dials. Collapsing them onto one number
   * would put identical digits behind a button in one place and an anchor three
   * lines below, which is the inconsistency the button-vs-anchor rule exists to
   * prevent, and it would make the "prefer a human" offer meaningless.
   */
  it('routes the AI and the humans to separate numbers', () => {
    expect(CONCIERGE_PHONE).not.toBe(CONTACT_PHONE)
  })

  /**
   * Validates: pressing the concierge CTA answers with the demo invitation.
   * Why it matters: a visitor who asks to be called has understood the product and
   * reached for it deliberately — that is the moment worth converting, and the
   * invitation toast is the only thing this demo has to convert with. Silence here
   * reads as a broken button.
   */
  it('answers the call request with the invitation', async () => {
    render(<ConciergeSection />)

    await userEvent.click(screen.getByRole('button', { name: /call scout/i }))

    expect(await screen.findByText(/we can make it true/i)).toBeInTheDocument()
  })

  /**
   * Validates: the equaliser is hidden from assistive technology.
   * Why it matters: it animates forever and encodes nothing — "Scout is available
   * now" is already stated in text beside it. Exposed, it would be an unlabelled
   * node in the middle of the card's reading order for no gain.
   */
  it('hides the voice equaliser from assistive technology', () => {
    render(<ConciergeSection />)

    // Decorative and role-less, so it is reachable only by attribute — the
    // documented exception. Anchored on the live-status row it belongs to.
    const status = screen.getByText(/scout is available now/i).parentElement
    expect(status?.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})
