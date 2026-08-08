import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MakeAnOfferCard } from '../components/MakeAnOfferCard'
import { generateListingsForTeam } from '../services/listingGenerator.service'
import { TEAMS } from '@/domains/teams/data/teams'

const team = TEAMS[0]
const listing = generateListingsForTeam(team)[0]

describe('demo-only listing actions', () => {
  /**
   * Validates: submitting an offer answers with the invitation, and the LinkedIn
   * link is a real, safely-targeted anchor.
   * Why it matters: this is the one dead control a visitor reaches *on purpose*
   * — it sits at the end of the whole flow, so whoever presses it has understood
   * the product. A silent no-op there wastes the only qualified lead the demo
   * produces. `rel="noopener"` because the tab it opens must not get a handle
   * back to this window.
   */
  it('answers the offer button with a way to get in touch', async () => {
    render(<MakeAnOfferCard listing={listing} />)

    await userEvent.click(screen.getByRole('button', { name: /submit offer/i }))

    expect(await screen.findByText(/we can make it true/i)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /linkedin\.com\/in\/angelarreola/i })
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/angelarreola')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
