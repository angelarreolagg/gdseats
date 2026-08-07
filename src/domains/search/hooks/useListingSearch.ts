import { useMemo, useState } from 'react'
import type { Listing } from '@/domains/listing/types/listing.types'
import {
  countBySection,
  filterBySection,
  sortListings,
  type SortKey,
} from '../services/listingSearch.service'

/** Form state and derived views; every calculation lives in the service. */
export function useListingSearch(listings: Listing[]) {
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [sort, setSort] = useState<SortKey>('best-deal')

  const sectionCounts = useMemo(() => countBySection(listings), [listings])

  const visible = useMemo(
    () => sortListings(filterBySection(listings, selectedSection), sort),
    [listings, selectedSection, sort],
  )

  function toggleSection(section: number) {
    setSelectedSection((current) => (current === section ? null : section))
  }

  function clearAll() {
    setSelectedSection(null)
    setSort('best-deal')
  }

  return {
    selectedSection,
    setSelectedSection,
    toggleSection,
    sort,
    setSort,
    sectionCounts,
    visible,
    clearAll,
    hasFilters: selectedSection !== null,
  }
}
