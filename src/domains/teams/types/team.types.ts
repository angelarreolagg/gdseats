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
