import { useRef, useState, type MouseEventHandler, type PropsWithChildren } from 'react'

interface Position {
  x: number
  y: number
}

interface SpotlightCardProps extends PropsWithChildren {
  className?: string
  /**
   * Any CSS colour, and **widened from upstream's `rgba(…)` template-literal
   * type on purpose.** That type cannot express `color-mix(in oklab, var(--psl-…))`,
   * which is how every other colour in this app is written — the theme is
   * nothing but custom properties, so a literal rgba would be the one hue on
   * the page that ignores light mode. See the default below.
   */
  spotlightColor?: string
}

/**
 * The default spotlight: the brand accent, thinned.
 *
 * Same formula as the hero's radial and the sell CTA's, so all three washes of
 * green on this page are recognisably one treatment. Because it resolves
 * `var(--psl-accent)` at paint time it follows the theme for free — no `dark:`
 * variant, which this codebase does not use anywhere.
 *
 * The element also multiplies this by its own `opacity` (0.6 at rest), so the
 * effective wash is around 13%. Pushing the mix much past 22% turns the corner
 * of the card the same green as the CTA button and starts competing with it.
 */
const DEFAULT_SPOTLIGHT = 'color-mix(in oklab, var(--psl-accent) 22%, transparent)'

/**
 * Adapted from React Bits. Upstream hard-codes a dark card and an rgba glow;
 * here it takes the app's own tokens, and `spotlightColor` was widened from
 * upstream's `rgba(…)` template type to `string` so it can hold a `var()`.
 *
 * **Nothing may be encoded in the spotlight**: touch devices never fire
 * `mousemove`, so a phone sees the card with no glow at all.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = DEFAULT_SPOTLIGHT,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState<number>(0)

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!divRef.current || isFocused) return

    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  const handleFocus = () => {
    setIsFocused(true)
    setOpacity(0.6)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setOpacity(0)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={() => setOpacity(0.6)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl border border-border-hairline bg-surface p-6 shadow-card sm:p-8 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  )
}
