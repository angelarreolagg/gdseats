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
  /**
   * Validates: the trend reaches the card as text, not only as a colour and a line.
   * Why it matters: the sparkline is a picture and the tone is a colour — neither
   * is readable by a screen reader or by a red-green colourblind user. The written
   * label is what makes the signal accessible at all.
   */
  it('states the market direction in words', () => {
    render(<TeamCard team={TEAM} onSelect={vi.fn()} />)
    const trend = getMarketTrend(TEAM)

    // The service emits keys; the card resolves them. Resolving here too is
    // what makes this assert the rendered sentence rather than the key beside it.
    expect(screen.getByText(i18n.t(trend.labelKey))).toBeInTheDocument()
    expect(screen.getByText(i18n.t(trend.buyerImplicationKey))).toBeInTheDocument()
  })

  /**
   * Validates: the chip carries the momentum figure as text.
   * Why it matters: this replaced a sparkline that was unreadable at 84×30. The
   * number is now the whole quantitative signal on the card — if it stopped
   * rendering, the card would state a direction with nothing behind it.
   */
  it('shows the momentum figure in the chip', () => {
    render(<TeamCard team={TEAM} onSelect={vi.fn()} />)
    const trend = getMarketTrend(TEAM)

    expect(screen.getByText(formatSignedPercent(trend.momentum))).toBeInTheDocument()
  })

  /**
   * Validates: the trend chip takes no tab stop inside the card.
   * Why it matters: the card is itself a `<button>`. A focusable tooltip trigger
   * nested in a button is invalid markup and would give the grid two tab stops
   * per card — sixteen on a page of eight.
   */
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

  /**
   * Validates: the card's listing count is the same function the generator uses.
   * Why it matters: the number here and the number in the search toolbar come from
   * one source. If they diverged, the card would promise inventory the next screen
   * does not have.
   */
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
