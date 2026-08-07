import {
  Accessibility,
  Armchair,
  CalendarClock,
  CircleDollarSign,
  CircleParking,
  Star,
  TrendingDown,
  Umbrella,
  type LucideIcon,
} from 'lucide-react'
import type { TagIconName } from '../types/listing.types'

/**
 * Resolves a tag's semantic name into an icon and its hover copy.
 *
 * Lives in `components/` rather than in the service so the generator stays free
 * of React. The tooltip is supplementary — the chip's own uppercase label already
 * names the amenity, so nothing is lost on touch, where hover never fires.
 */
export const TAG_PRESENTATION: Record<TagIconName, { Icon: LucideIcon; tooltip: string }> = {
  featured: { Icon: Star, tooltip: 'Promoted by the seller' },
  'this-week': { Icon: CalendarClock, tooltip: 'Listed within the last 7 days' },
  parking: { Icon: CircleParking, tooltip: 'Parking pass included' },
  aisle: { Icon: Armchair, tooltip: 'Aisle seat' },
  covered: { Icon: Umbrella, tooltip: 'Covered from the weather' },
  accessible: { Icon: Accessibility, tooltip: 'Wheelchair accessible' },
  financing: { Icon: CircleDollarSign, tooltip: 'Financing options available' },
  'price-drop': { Icon: TrendingDown, tooltip: 'Asking price has come down' },
}
