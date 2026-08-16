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

/** Below this a move is noise; a card announcing ±1% teaches readers to ignore it. */
export const MATERIAL_MOMENTUM = 0.03

/**
 * Presentation per direction. The tone is INVERTED against the intuitive
 * reading: green means good for the buyer, so a cooling market is the green one.
 * Matches `insights.service.ts`, which scores a falling ask as positive.
 *
 * Keys, not phrases, so this stays free of copy as well as of React.
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

/** Indices, not labels: month names are copy and this layer holds none. */
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
 * Where a franchise's market is heading. Seeded on the team id, or the momentum
 * and the series would contradict each other between renders. Anchored so the
 * last actual point lands near `demandIndex × 100`.
 */
export function getMarketTrend(team: Team, now: Date = new Date()): MarketTrend {
  const random = createRandom(`trend:${team.id}`)
  const anchor = team.demandIndex * 100

  // Centred on zero so the catalogue splits between the three directions rather
  // than skewing one way, and wide enough that the ±3% band stays a minority.
  const drift = random.float(-0.05, 0.05)

  const history: number[] = [anchor]
  for (let index = 0; index < HISTORY_MONTHS - 1; index += 1) {
    const noise = random.float(-0.02, 0.02)
    const previous = history[0] / (1 + drift + noise)
    history.unshift(Math.max(4, previous))
  }

  // Damped: extrapolating at full strength is how forecasts end up absurd.
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

  // Measured across the forecast: the card answers what is about to happen.
  const lastActual = history[history.length - 1]
  const lastProjected = forecast[forecast.length - 1]
  const momentum = lastActual > 0 ? (lastProjected - lastActual) / lastActual : 0

  const direction = classifyMomentum(momentum)

  return { direction, momentum, series, ...PRESENTATION[direction] }
}
