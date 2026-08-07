import type { TrendPoint, TrendTone } from '../types/team.types'

interface TrendSparklineProps {
  series: TrendPoint[]
  tone: TrendTone
  /** Full sentence for screen readers; the chip beside repeats it visually. */
  label: string
  className?: string
}

const WIDTH = 84
const HEIGHT = 30
const PAD = 3

const TONE_STROKE: Record<TrendTone, string> = {
  good: 'var(--psl-good)',
  fair: 'var(--psl-fair)',
  neutral: 'var(--psl-muted)',
}

/**
 * 12 months of demand plus a 3-month projection.
 *
 * History is a solid line in the muted token — it is context. The forecast is
 * DASHED, which is the one job dashing does honestly: it reads as projection,
 * which is exactly what it is. No axes, no gridlines, no point labels; the
 * momentum figure sits beside it in text.
 */
export function TrendSparkline({ series, tone, label, className = '' }: TrendSparklineProps) {
  if (series.length < 2) return null

  const values = series.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const x = (index: number) => PAD + (index / (series.length - 1)) * (WIDTH - PAD * 2)
  const y = (value: number) => HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2)

  const toPath = (points: TrendPoint[], offset: number) =>
    points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${x(index + offset).toFixed(1)} ${y(point.value).toFixed(1)}`
      })
      .join(' ')

  const lastActualIndex = series.findIndex((point) => point.projected) - 1
  const splitAt = lastActualIndex < 0 ? series.length - 1 : lastActualIndex

  const actual = series.slice(0, splitAt + 1)
  // The forecast path starts on the last actual point so the two segments join.
  const projected = series.slice(splitAt)

  const endPoint = series[series.length - 1]

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      role="img"
      aria-label={label}
    >
      <path
        d={toPath(actual, 0)}
        fill="none"
        stroke="var(--psl-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={toPath(projected, splitAt)}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth="2"
        strokeDasharray="3 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Surface ring keeps the end dot legible where it sits on the line. */}
      <circle
        cx={x(series.length - 1)}
        cy={y(endPoint.value)}
        r="2.5"
        fill={TONE_STROKE[tone]}
        stroke="var(--psl-surface)"
        strokeWidth="2"
      />
    </svg>
  )
}
