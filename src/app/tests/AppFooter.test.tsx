import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppFooter } from '../components/AppFooter'

describe('AppFooter', () => {
  /**
   * Validates: the policy shelf explains itself instead of failing silently.
   * Why it matters: a marketplace asking for five figures is judged on whether
   * Terms and Privacy exist at all. A link that does nothing when clicked reads
   * as a broken site — which costs more trust than admitting the demo has no
   * page behind it.
   */
  it('tells the user why the company links go nowhere', async () => {
    render(<AppFooter />)

    await userEvent.click(screen.getByRole('button', { name: 'Terms of service' }))

    expect(await screen.findByText(/not available — this is a demo/i)).toBeInTheDocument()
  })

  /**
   * Validates: dead chrome is a button, live contact details are anchors.
   * Why it matters: a screen reader announces "link" as "this navigates". Three
   * of these navigate nowhere and two really do hand off to the phone and mail
   * apps — the roles have to tell them apart, and `tel:`/`mailto:` are the only
   * two things on this page that work without a backend.
   */
  it('separates the dead links from the working ones by role', () => {
    render(<AppFooter />)

    for (const label of ['Terms of service', 'Privacy policy', 'Sitemap']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument()
    }

    expect(screen.getByRole('link', { name: '+1 (512) 555-0142' })).toHaveAttribute(
      'href',
      'tel:+15125550142',
    )
    expect(screen.getByRole('link', { name: 'help@gdseats.com' })).toHaveAttribute(
      'href',
      'mailto:help@gdseats.com',
    )
  })

  /**
   * Validates: the trust block — brand, promise, registered address, copyright.
   * Why it matters: this is the footer's whole job. A secondary market with no
   * postal address behind it looks like a scrape, not a business.
   */
  it('carries the trust block', () => {
    render(<AppFooter />)

    expect(screen.getByText('G&D Seats')).toBeInTheDocument()
    expect(screen.getByText(/your trusted marketplace/i)).toBeInTheDocument()
    expect(screen.getByText(/austin, tx 78701/i)).toBeInTheDocument()
    expect(screen.getByText(/© 2026 G&D Seats\. All rights reserved\./i)).toBeInTheDocument()
  })
})
