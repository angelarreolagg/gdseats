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
 * Resolves a tag's semantic name into an icon and the key for its hover copy.
 *
 * Lives in `components/` rather than in the service so the generator stays free
 * of React — and it holds a `tooltipKey` rather than the sentence for the same
 * reason `ListingTag` holds a `labelKey`: this file chooses the icon, the locale
 * bundle owns the words.
 *
 * The tooltip stays supplementary in every language. The chip's own label names
 * the amenity, so nothing is lost on touch, where hover never fires — which is
 * also why `TRANSLATORS.md` says the label must stand alone and the tooltip may
 * not be where the meaning lives.
 */
export const TAG_PRESENTATION: Record<TagIconName, { Icon: LucideIcon; tooltipKey: string }> = {
  featured: { Icon: Star, tooltipKey: 'listing:tagTooltips.featured' },
  'this-week': { Icon: CalendarClock, tooltipKey: 'listing:tagTooltips.thisWeek' },
  parking: { Icon: CircleParking, tooltipKey: 'listing:tagTooltips.parking' },
  aisle: { Icon: Armchair, tooltipKey: 'listing:tagTooltips.aisle' },
  covered: { Icon: Umbrella, tooltipKey: 'listing:tagTooltips.covered' },
  accessible: { Icon: Accessibility, tooltipKey: 'listing:tagTooltips.accessible' },
  financing: { Icon: CircleDollarSign, tooltipKey: 'listing:tagTooltips.financing' },
  'price-drop': { Icon: TrendingDown, tooltipKey: 'listing:tagTooltips.priceDrop' },
}
