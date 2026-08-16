import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamCard } from '../components/TeamCard'
import { getMarketTrend } from '../services/marketTrend.service'
import { getListingCountForTeam, getTeamById } from '../data/teams'
import { formatSignedPercent } from '@/shared/utils/formatters'
import i18n from '@/shared/i18n'

const TEAM = getTeamById('dal')!

describe('TeamCard', () => {
  it('states the market direction in words', () => {
    render(<TeamCard team={TEAM} onSelect={vi.fn()} />)
    const trend = getMarketTrend(TEAM)

    // The service emits keys; the card resolves them. Resolving here too is
    // what makes this assert the rendered sentence rather than the key beside it.
    expect(screen.getByText(i18n.t(trend.labelKey))).toBeInTheDocument()
    expect(screen.getByText(i18n.t(trend.buyerImplicationKey))).toBeInTheDocument()
  })

  it('shows the momentum figure in the chip', () => {
    render(<TeamCard team={TEAM} onSelect={vi.fn()} />)
    const trend = getMarketTrend(TEAM)

    expect(screen.getByText(formatSignedPercent(trend.momentum))).toBeInTheDocument()
  })

  it('does not add a second tab stop to the card', async () => {
    render(
      <>
        <button type="button">before</button>
        <TeamCard team={TEAM} onSelect={vi.fn()} />
        <button type="button">after</button>
      </>,
    )

    await userEvent.tab()
    expect(screen.getByText('before')).toHaveFocus()
    await userEvent.tab() // the card itself
    await userEvent.tab()
    expect(screen.getByText('after')).toHaveFocus()
  })

  it('shows the same listing count the generator will produce', () => {
    render(<TeamCard team={TEAM} onSelect={vi.fn()} />)
    const expected = getListingCountForTeam(TEAM).toLocaleString('en-US')

    expect(screen.getByText(new RegExp(`${expected} listings`, 'i'))).toBeInTheDocument()
  })

  it('renders the franchise identity', () => {
    render(<TeamCard team={TEAM} onSelect={vi.fn()} />)

    expect(screen.getByText('Dallas Cowboys')).toBeInTheDocument()
    expect(screen.getByText('AT&T Stadium')).toBeInTheDocument()
  })

  it('selects the team it describes', async () => {
    const onSelect = vi.fn()
    render(<TeamCard team={TEAM} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('dal')
  })
})
