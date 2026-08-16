import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppFooter } from '../components/AppFooter'

describe('AppFooter', () => {
  it('tells the user why the company links go nowhere', async () => {
    render(<AppFooter />)

    await userEvent.click(screen.getByRole('button', { name: 'Terms of service' }))

    expect(await screen.findByText(/not available — this is a demo/i)).toBeInTheDocument()
  })

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

  it('carries the trust block', () => {
    render(<AppFooter />)

    expect(screen.getByText('G&D Seats')).toBeInTheDocument()
    expect(screen.getByText(/your trusted marketplace/i)).toBeInTheDocument()
    expect(screen.getByText(/austin, tx 78701/i)).toBeInTheDocument()
    expect(screen.getByText(/© 2026 G&D Seats\. All rights reserved\./i)).toBeInTheDocument()
  })
})
