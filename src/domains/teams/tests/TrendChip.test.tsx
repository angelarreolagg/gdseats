import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, setViewport, within } from '@/test/utils'
import { TrendChip } from '../components/TrendChip'
import { getMarketTrend } from '../services/marketTrend.service'
import { getTrendExplanation } from '../components/trendPresentation'
import { TEAMS, getTeamById } from '../data/teams'
import { formatPercent, formatSignedPercent } from '@/shared/utils/formatters'
import i18n from '@/shared/i18n'

const NOW = new Date('2026-08-07')
const TREND = getMarketTrend(getTeamById('dal')!, NOW)

/** The label the chip renders, resolved the way the component resolves it. */
const label = (trend = TREND) => i18n.t(trend.labelKey)

/**
 * The explanation as the chip renders it.
 *
 * `getTrendExplanation` returns keys plus the counted horizon now, so a test
 * that wants to find the sentence on screen has to resolve it the same way —
 * including passing `count`, which is what selects the plural form.
 */
function explain(trend = TREND) {
  const { forecastKey, implicationKey, months, momentum } = getTrendExplanation(trend)
  return {
    forecast: i18n.t(forecastKey, { count: months, magnitude: formatPercent(momentum) }),
    implication: i18n.t(implicationKey),
  }
}

describe('TrendChip', () => {
  it('renders the label and the momentum without hovering', () => {
    render(<TrendChip trend={TREND} />)

    expect(screen.getByText(label())).toBeInTheDocument()
    expect(screen.getByText(formatSignedPercent(TREND.momentum))).toBeInTheDocument()
  })

  // The second tap matters: Radix closes on the trigger's pointerdown, which
  // lands before the click that toggles it.
  it('opens the explanation on tap where there is no hover', async () => {
    setViewport('mobile')
    const { container } = render(<TrendChip trend={TREND} />)

    // Scoped to the container because the open panel repeats the label in its own
    // header — and it renders through a portal, outside this node. `screen` would
    // find both and throw on the second tap.
    const chip = () => within(container).getByText(label())
    const { forecast } = explain()

    expect(screen.queryByText(forecast)).not.toBeInTheDocument()

    await userEvent.click(chip())
    expect(await screen.findByText(forecast)).toBeInTheDocument()

    await userEvent.click(chip())
    expect(screen.queryByText(forecast)).not.toBeInTheDocument()
  })

  it('does not activate its container when tapped', async () => {
    setViewport('mobile')
    const onSelect = vi.fn()
    render(
      <button type="button" onClick={onSelect}>
        <TrendChip trend={TREND} />
      </button>,
    )

    await userEvent.click(screen.getByText(label()))

    expect(await screen.findByText(explain().forecast)).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('opens the explanation on keyboard focus when focusable', async () => {
    render(<TrendChip trend={TREND} focusable />)
    const { forecast, implication } = explain()

    await userEvent.tab()
    const tooltip = await screen.findByRole('tooltip')

    expect(tooltip).toHaveTextContent(forecast)
    expect(tooltip).toHaveTextContent(implication)
  })

  it('titles the tooltip with the direction it explains', async () => {
    render(<TrendChip trend={TREND} focusable />)

    await userEvent.tab()
    const tooltip = await screen.findByRole('tooltip')

    expect(tooltip).toHaveTextContent(label())
    expect(tooltip).toHaveTextContent(formatSignedPercent(TREND.momentum))
  })

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

  it('omits the figure when the market is steady', () => {
    const steady = TEAMS.map((team) => getMarketTrend(team, NOW)).find(
      (trend) => trend.direction === 'steady',
    )!

    render(<TrendChip trend={steady} />)

    expect(screen.getByText(label(steady))).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(explain(steady).forecast).toMatch(/projected to hold/i)
  })

  it('pairs the colour with an icon and a written label', () => {
    const { container } = render(<TrendChip trend={TREND} />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText(label())).toBeInTheDocument()
  })
})
