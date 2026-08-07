import { useMemo, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { IconButton } from '@/shared/components/IconButton'
import { buildSectionGeometry, CENTER, FIELD, VIEWBOX } from '../data/venueLayout'

interface SeatMapProps {
  /** How many listings sit in each section; absent means none. */
  sectionCounts?: Map<number, number>
  selectedSection?: number | null
  onSelectSection?: (section: number) => void
  /** Static mode for the detail overlay: highlight only, no interaction. */
  readOnly?: boolean
  showControls?: boolean
  showLabels?: boolean
  className?: string
}

const MIN_ZOOM = 1
const MAX_ZOOM = 2.6

export function SeatMap({
  sectionCounts,
  selectedSection = null,
  onSelectSection,
  readOnly = false,
  showControls = true,
  showLabels = true,
  className = '',
}: SeatMapProps) {
  const geometry = useMemo(() => buildSectionGeometry(), [])
  const [zoom, setZoom] = useState(1)

  // Zoom keeps the bowl centred by shrinking the viewBox around the centre point.
  const width = VIEWBOX.width / zoom
  const height = VIEWBOX.height / zoom
  const viewBox = `${CENTER.x - width / 2} ${CENTER.y - height / 2} ${width} ${height}`

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        role={readOnly ? 'img' : 'group'}
        aria-label={
          readOnly
            ? `Seat map, section ${selectedSection ?? 'not selected'} highlighted`
            : 'Stadium seat map — select a section to filter listings'
        }
      >
        {/* Field. */}
        <rect
          x={FIELD.x}
          y={FIELD.y}
          width={FIELD.width}
          height={FIELD.height}
          rx="6"
          fill="var(--psl-field)"
        />
        <g stroke="var(--psl-field-line)" strokeWidth="1" opacity="0.5">
          {Array.from({ length: 5 }, (_, index) => (
            <line
              key={index}
              x1={FIELD.x + ((index + 1) * FIELD.width) / 6}
              y1={FIELD.y}
              x2={FIELD.x + ((index + 1) * FIELD.width) / 6}
              y2={FIELD.y + FIELD.height}
            />
          ))}
        </g>

        {geometry.map((wedge) => {
          const count = sectionCounts?.get(wedge.section) ?? 0
          const isEmpty = sectionCounts !== undefined && count === 0
          const isSelected = selectedSection === wedge.section
          const interactive = !readOnly && !isEmpty

          const fill = isSelected
            ? 'var(--psl-accent)'
            : isEmpty
              ? 'var(--psl-track)'
              : 'var(--psl-seat)'

          return (
            <g key={wedge.section}>
              <path
                d={wedge.path}
                fill={fill}
                stroke="var(--psl-surface)"
                strokeWidth="1.5"
                opacity={isEmpty ? 0.35 : 1}
                className={
                  interactive
                    ? 'cursor-pointer transition-[fill,opacity] hover:opacity-80'
                    : undefined
                }
                onClick={interactive ? () => onSelectSection?.(wedge.section) : undefined}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={
                  interactive
                    ? `Section ${wedge.section}, ${count} listing${count === 1 ? '' : 's'}`
                    : undefined
                }
                aria-pressed={interactive ? isSelected : undefined}
                onKeyDown={
                  interactive
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectSection?.(wedge.section)
                        }
                      }
                    : undefined
                }
              />
              {showLabels && wedge.level !== 3 ? (
                <text
                  x={wedge.labelX}
                  y={wedge.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fill={isSelected ? 'var(--psl-on-accent)' : 'var(--psl-muted)'}
                  fontSize="8"
                >
                  {wedge.section}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      {showControls ? (
        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
          <IconButton
            label="Zoom in"
            size="sm"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + 0.4))}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Zoom out"
            size="sm"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - 0.4))}
          >
            <Minus aria-hidden="true" className="h-4 w-4" />
          </IconButton>
          <IconButton label="Reset view" size="sm" onClick={() => setZoom(1)}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}
