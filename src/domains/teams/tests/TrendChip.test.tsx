import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/utils'
import { TrendChip } from '../components/TrendChip'
import { getMarketTrend } from '../services/marketTrend.service'
import { getTrendExplanation } from '../components/trendPresentation'
import { TEAMS, getTeamById } from '../data/teams'
import { formatSignedPercent } from '@/shared/utils/formatters'

const NOW = new Date('2026-08-07')
const TREND = getMarketTrend(getTeamById('dal')!, NOW)

describe('TrendChip', () => {
  /**
   * Validates: direction and magnitude are visible text, not tooltip-only.
   * Why it matters: hover never fires on touch. If the label or the percentage
   * lived only in the tooltip, the chip would be meaningless on a phone.
   */
  it('renders the label and the momentum without hovering', () => {
    render(<TrendChip trend={TREND} />)

    expect(screen.getByText(TREND.label)).toBeInTheDocument()
    expect(screen.getByText(formatSignedPercent(TREND.momentum))).toBeInTheDocument()
  })

  /**
   * Validates: the explanation is reachable by keyboard when the chip opts in.
   * Why it matters: a hover-only tooltip is invisible to keyboard users. The
   * toolbar variant is the one place the reasoning must be reachable that way.
   */
  it('opens the explanation on keyboard focus when focusable', async () => {
    render(<TrendChip trend={TREND} focusable />)
    const { forecast, implication } = getTrendExplanation(TREND)

    await userEvent.tab()
    const tooltip = await screen.findByRole('tooltip')

    expect(tooltip).toHaveTextContent(forecast)
    expect(tooltip).toHaveTextContent(implication)
  })

  /**
   * Validates: the tooltip is a titled panel, not a run of text.
   * Why it matters: it can open some distance from its trigger — on the team grid
   * it floats over neighbouring cards — so it has to say what it is about. The
   * header repeats the direction the chip states.
   */
  it('titles the tooltip with the direction it explains', async () => {
    render(<TrendChip trend={TREND} focusable />)

    await userEvent.tab()
    const tooltip = await screen.findByRole('tooltip')

    expect(tooltip).toHaveTextContent(TREND.label)
    expect(tooltip).toHaveTextContent(formatSignedPercent(TREND.momentum))
  })

  /**
   * Validates: the default variant takes no tab stop.
   * Why it matters: this is the variant used inside `TeamCard`, which is itself a
   * `<button>`. A focusable element nested in a button is invalid markup, and
   * eight cards would mean eight extra stops between one team and the next.
   */
  it('takes no tab stop by default', async () => {
    render(
      <>
        <button type="button">before</button>
        <TrendChip trend={TREND} />
        <button type="button">after</button>
      </>,
    )

    await userEvent.tab()
    expect(screen.getByText('before')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByText('after')).toHaveFocus()
  })

  /**
   * Validates: a steady market shows no percentage.
   * Why it matters: steady rounds to "0%", which reads as missing data rather
   * than as a measurement — and "no movement" is exactly what the label already
   * says. The figure stays in the tooltip for anyone who wants it.
   */
  it('omits the figure when the market is steady', () => {
    const steady = TEAMS.map((team) => getMarketTrend(team, NOW)).find(
      (trend) => trend.direction === 'steady',
    )!

    render(<TrendChip trend={steady} />)

    expect(screen.getByText(steady.label)).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(getTrendExplanation(steady).forecast).toMatch(/projected to hold/i)
  })

  /**
   * Validates: direction never rides on colour alone.
   * Why it matters: green vs amber measure CVD ΔE 7.0 under deuteranopia. The
   * icon and the written label are the mitigation, as everywhere else here.
   */
  it('pairs the colour with an icon and a written label', () => {
    const { container } = render(<TrendChip trend={TREND} />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText(TREND.label)).toBeInTheDocument()
  })
})
