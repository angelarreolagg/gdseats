/**
 * A generic three-tier bowl, shared by the seat map and the listing generator so
 * the map's section numbers and the list's section numbers are the same set.
 *
 * This is a schematic, not a survey of any real venue: concentric rings of equal
 * sections around a centred field. It carries the information a buyer needs from
 * a seat map — which tier, which side, how far from the field — without pretending
 * to be an accurate floor plan.
 */

export interface Ring {
  level: 1 | 2 | 3
  label: string
  /** First section number in the ring; sections run consecutively. */
  start: number
  count: number
  /** Ellipse radii of the ring's inner edge. */
  radiusX: number
  radiusY: number
  depth: number
  /** Price multiplier against the team's base price per seat. */
  priceMultiplier: number
}

export const VIEWBOX = { width: 600, height: 460 }
export const CENTER = { x: 300, y: 230 }

export const FIELD = { x: 222, y: 182, width: 156, height: 96 }

export const RINGS: Ring[] = [
  { level: 1, label: 'Lower', start: 101, count: 20, radiusX: 118, radiusY: 78, depth: 30, priceMultiplier: 1.35 },
  { level: 2, label: 'Club', start: 201, count: 24, radiusX: 158, radiusY: 116, depth: 28, priceMultiplier: 1.0 },
  { level: 3, label: 'Upper', start: 301, count: 28, radiusX: 196, radiusY: 152, depth: 32, priceMultiplier: 0.55 },
]

export const ALL_SECTIONS: number[] = RINGS.flatMap((ring) =>
  Array.from({ length: ring.count }, (_, index) => ring.start + index),
)

export function getRingForSection(section: number): Ring | undefined {
  return RINGS.find((ring) => section >= ring.start && section < ring.start + ring.count)
}

/**
 * Sideline premium. Sections are numbered around the bowl starting at the prime
 * sideline, so proximity to it is angular — the first and last sections of a ring
 * are neighbours, and both sit on the 50-yard line.
 */
export function getSidelineMultiplier(section: number): number {
  const ring = getRingForSection(section)
  if (!ring) return 1

  const index = section - ring.start
  const half = ring.count / 2
  // 0 at the prime sideline, 1 behind the opposite end zone.
  const distance = Math.abs(((index + half) % ring.count) - half) / half

  if (distance <= 0.2) return 1.28 // sideline
  if (distance <= 0.45) return 1.12 // corner
  return 1 // end zone
}

export interface SectionGeometry {
  section: number
  level: 1 | 2 | 3
  /** SVG path for the section's wedge. */
  path: string
  /** Centroid, for the label. */
  labelX: number
  labelY: number
}

function pointOn(radiusX: number, radiusY: number, angle: number) {
  return {
    x: CENTER.x + radiusX * Math.cos(angle),
    y: CENTER.y + radiusY * Math.sin(angle),
  }
}

/** Every section wedge in the bowl, laid out once and reused by both maps. */
export function buildSectionGeometry(): SectionGeometry[] {
  const geometry: SectionGeometry[] = []

  for (const ring of RINGS) {
    const step = (Math.PI * 2) / ring.count
    // A hair of angular padding is what separates neighbouring wedges — a gap in
    // the surface colour rather than a stroke drawn around each one.
    const pad = step * 0.06
    const outerX = ring.radiusX + ring.depth
    const outerY = ring.radiusY + ring.depth

    for (let index = 0; index < ring.count; index += 1) {
      // Start at the top of the ellipse so section N01 sits on the near sideline.
      const start = -Math.PI / 2 + index * step + pad
      const end = start + step - pad * 2
      const mid = (start + end) / 2

      const innerStart = pointOn(ring.radiusX, ring.radiusY, start)
      const innerEnd = pointOn(ring.radiusX, ring.radiusY, end)
      const outerStart = pointOn(outerX, outerY, start)
      const outerEnd = pointOn(outerX, outerY, end)

      geometry.push({
        section: ring.start + index,
        level: ring.level,
        path: [
          `M ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
          `L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
          `A ${outerX} ${outerY} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
          `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
          `A ${ring.radiusX} ${ring.radiusY} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
          'Z',
        ].join(' '),
        ...(() => {
          const label = pointOn(ring.radiusX + ring.depth / 2, ring.radiusY + ring.depth / 2, mid)
          return { labelX: label.x, labelY: label.y }
        })(),
      })
    }
  }

  return geometry
}
