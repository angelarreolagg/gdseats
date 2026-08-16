import { createRandom } from '@/shared/utils/seededRandom'
import type {
  MarketTrend,
  Team,
  TrendDirection,
  TrendPoint,
  TrendTone,
} from '../types/team.types'

const HISTORY_MONTHS = 12
const FORECAST_MONTHS = 3

/**
 * Below this, a move is noise. A card that announces a ±1% shift teaches the
 * reader to stop believing the ones that matter.
 */
export const MATERIAL_MOMENTUM = 0.03

/**
 * Presentation per direction.
 *
 * The tone is deliberately INVERTED against the intuitive reading: green means
 * good for the buyer, not "number went up". A cooling market is where seats get
 * cheaper, so it is the green one. This matches `insights.service.ts`, which
 * already scores a falling ask as positive — without the inversion, the same
 * green would mean "good deal" on a listing and "expensive" on a team card.
 *
 * That inversion is a translation hazard as much as a colour one: a Spanish
 * "Enfriándose" reworded into something that reads as bad news would contradict
 * the green it is printed in. It is stated in `locales/TRANSLATORS.md` for
 * exactly that reason.
 *
 * Keys, not phrases, so this file stays free of copy as well as of React.
 */
const PRESENTATION: Record<TrendDirection, {
  labelKey: string
  buyerImplicationKey: string
  tone: TrendTone
  iconName: TrendDirection
}> = {
  heating: {
    labelKey: 'teams:trend.label.heating',
    buyerImplicationKey: 'teams:trend.buyerImplication.heating',
    tone: 'fair',
    iconName: 'heating',
  },
  steady: {
    labelKey: 'teams:trend.label.steady',
    buyerImplicationKey: 'teams:trend.buyerImplication.steady',
    tone: 'neutral',
    iconName: 'steady',
  },
  cooling: {
    labelKey: 'teams:trend.label.cooling',
    buyerImplicationKey: 'teams:trend.buyerImplication.cooling',
    tone: 'good',
    iconName: 'cooling',
  },
}

/**
 * Month indices rather than the `['Jan', 'Feb', …]` labels this replaced.
 *
 * `MarketTrend.series[].monthIndex` is not currently rendered — the sparkline
 * was removed — but the series is not dead data: `momentum` is derived from it
 * and `getTrendExplanation` counts its projected points to state its own
 * horizon. An index keeps that true and leaves the field translatable if a chart
 * ever comes back, rather than parking an English string nobody looks at.
 */
function monthIndices(count: number, now: Date): number[] {
  const indices: number[] = []
  // Start far enough back that the last actual point is the current month.
  for (let offset = HISTORY_MONTHS - 1; offset > HISTORY_MONTHS - 1 - count; offset -= 1) {
    indices.push(new Date(now.getFullYear(), now.getMonth() - offset, 1).getMonth())
  }
  return indices
}

/** Exactly ±3% is still steady — only a strictly larger move is a trend. */
export function classifyMomentum(momentum: number): TrendDirection {
  if (momentum > MATERIAL_MOMENTUM) return 'heating'
  if (momentum < -MATERIAL_MOMENTUM) return 'cooling'
  return 'steady'
}

/** The label, tone, and icon name a direction always travels with. */
export function getTrendPresentation(direction: TrendDirection) {
  return PRESENTATION[direction]
}

/**
 * Where a franchise's market is heading.
 *
 * Seeded on the team id like every other generator here: the sparkline and the
 * percentage printed beside it are two views of one array, so an unseeded walk
 * would let them contradict each other between renders.
 *
 * The series is anchored so the last ACTUAL point lands near `demandIndex × 100`,
 * which keeps this consistent with the inventory size derived from the same field.
 */
export function getMarketTrend(team: Team, now: Date = new Date()): MarketTrend {
  const random = createRandom(`trend:${team.id}`)
  const anchor = team.demandIndex * 100

  // Monthly drift for this franchise, centred on zero so the catalogue splits
  // roughly evenly between heating, steady, and cooling rather than skewing one
  // way. The range is wide enough that the ±3% steady band stays a minority of
  // the spread — a catalogue where most cards read "Steady" shows nothing.
  const drift = random.float(-0.05, 0.05)

  const history: number[] = [anchor]
  for (let index = 0; index < HISTORY_MONTHS - 1; index += 1) {
    const noise = random.float(-0.02, 0.02)
    const previous = history[0] / (1 + drift + noise)
    history.unshift(Math.max(4, previous))
  }

  // The forecast continues the trend, damped — a projection that extrapolates a
  // trend at full strength is how forecasts end up absurd three steps out.
  const forecast: number[] = []
  let last = history[history.length - 1]
  for (let index = 0; index < FORECAST_MONTHS; index += 1) {
    last = Math.max(4, last * (1 + drift * 0.85 + random.float(-0.008, 0.008)))
    forecast.push(last)
  }

  const months = monthIndices(HISTORY_MONTHS + FORECAST_MONTHS, now)
  const series: TrendPoint[] = [...history, ...forecast].map((value, index) => ({
    monthIndex: months[index],
    value: Math.round(value * 10) / 10,
    projected: index >= HISTORY_MONTHS,
  }))

  // Measured across the forecast horizon: the card answers "what is about to
  // happen", not "what already did".
  const lastActual = history[history.length - 1]
  const lastProjected = forecast[forecast.length - 1]
  const momentum = lastActual > 0 ? (lastProjected - lastActual) / lastActual : 0

  const direction = classifyMomentum(momentum)

  return { direction, momentum, series, ...PRESENTATION[direction] }
}
