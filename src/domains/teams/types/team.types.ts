export type TrendDirection = 'heating' | 'steady' | 'cooling'

/** Reuses the status tones already measured in theme.css. */
export type TrendTone = 'good' | 'fair' | 'neutral'

export interface TrendPoint {
  label: string
  /** Demand index, 0–100. */
  value: number
  /** True for the forecast tail, drawn dashed. */
  projected: boolean
}

export interface MarketTrend {
  direction: TrendDirection
  /** Signed fraction across the forecast horizon. */
  momentum: number
  /** 12 actual months plus 3 projected, oldest first. */
  series: TrendPoint[]
  label: string
  /** What the direction means for someone buying, not for the franchise. */
  buyerImplication: string
  tone: TrendTone
  /** Semantic name; `components/trendPresentation.ts` resolves the icon. */
  iconName: TrendDirection
}

export interface Team {
  id: string
  name: string
  venue: string
  /** Franchise colours, used to generate the card artwork. */
  primary: string
  secondary: string
  /** Baseline price per seat for this franchise, before seat quality. */
  basePricePerSeat: number
  /** 0–1. Secondary-market appetite. Also sizes the team's inventory. */
  demandIndex: number
}
