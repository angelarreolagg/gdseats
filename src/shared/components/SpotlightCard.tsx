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
 * A card that lights up under the cursor, with the glow tracking the pointer.
 *
 * Adapted from React Bits, like `StrokeText`. Two deliberate divergences from
 * upstream, both about this codebase's rules rather than taste:
 *
 * 1. **Colours are tokens, not literals.** Upstream hard-codes
 *    `border-neutral-800 bg-neutral-900` and an rgba spotlight, which would
 *    render a permanently dark card in light mode. Here it is the same
 *    `border-border-hairline` + `bg-surface` every other card in the app uses,
 *    so it themes for free.
 * 2. **Named export**, matching the rest of `shared/components/`. `StrokeText`
 *    is the sole default export because it is kept byte-close to upstream for
 *    re-syncing; this one is already adapted, so there is nothing to re-sync.
 *
 * Reduced motion needs no handling: the only animation is the glow's
 * `transition-opacity`, and the `prefers-reduced-motion` block in `globals.css`
 * clamps every `transition-duration` to 0.01ms, so the fade simply stops being
 * a fade. Nothing moves on the page either way — the glow is paint, not layout.
 *
 * Touch devices never fire `mousemove`, so the spotlight just never appears.
 * That is the correct outcome, and the reason nothing may be encoded in it: the
 * card must read identically with the glow absent.
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
