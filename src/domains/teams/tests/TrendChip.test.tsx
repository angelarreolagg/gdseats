import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, setViewport, within } from '@/test/utils'
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
   * Validates: on a touch device the reasoning opens on tap, and a second tap
   * closes it.
   * Why it matters: the forecast sentence is the one thing in this feature that
   * lives *only* in the tooltip, and a hover tooltip never fires on touch — so on
   * a phone the Popularity Insight was a chip with no explanation behind it. The
   * second tap matters as much as the first: Radix closes a tooltip on the
   * trigger's `pointerdown`, which lands before the `click` that toggles it, so
   * the obvious implementation opens on every tap and can never be dismissed.
   */
  it('opens the explanation on tap where there is no hover', async () => {
    setViewport('mobile')
    const { container } = render(<TrendChip trend={TREND} />)

    // Scoped to the container because the open panel repeats the label in its own
    // header — and it renders through a portal, outside this node. `screen` would
    // find both and throw on the second tap.
    const chip = () => within(container).getByText(TREND.label)
    const { forecast } = getTrendExplanation(TREND)

    expect(screen.queryByText(forecast)).not.toBeInTheDocument()

    await userEvent.click(chip())
    expect(await screen.findByText(forecast)).toBeInTheDocument()

    await userEvent.click(chip())
    expect(screen.queryByText(forecast)).not.toBeInTheDocument()
  })

  /**
   * Validates: tapping the chip does not activate whatever contains it.
   * Why it matters: `TeamCard` is a `<button>` and the chip sits inside it. A tap
   * that both opens the tooltip and navigates to the franchise means the buyer
   * never gets to read the sentence they tapped for — they are on another screen
   * before it renders. This is the actual regression risk of the whole change.
   */
  it('does not activate its container when tapped', async () => {
    setViewport('mobile')
    const onSelect = vi.fn()
    render(
      <button type="button" onClick={onSelect}>
        <TrendChip trend={TREND} />
      </button>,
    )

    await userEvent.click(screen.getByText(TREND.label))

    expect(await screen.findByText(getTrendExplanation(TREND).forecast)).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
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
