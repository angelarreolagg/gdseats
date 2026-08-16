import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from 'motion/react'

interface ShinyTextProps {
  text: string
  disabled?: boolean
  /** Seconds for one sweep. */
  speed?: number
  className?: string
  /** The resting colour of the glyphs. Any CSS colour, `var()` included. */
  color?: string
  /** The colour of the travelling highlight. */
  shineColor?: string
  spread?: number
  yoyo?: boolean
  pauseOnHover?: boolean
  direction?: 'left' | 'right'
  /** Seconds held between sweeps, with the shine parked off-screen. */
  delay?: number
}

/**
 * Adapted from React Bits. The glyphs are painted with `background-clip: text`
 * over a transparent fill, so **the gradient IS the colour** — a `text-*`
 * utility does nothing here.
 *
 * **Reduced motion is hand-gated**, and is the likeliest thing lost in a
 * re-sync: `useAnimationFrame` is a raw loop `MotionConfig` never sees. Parking
 * `progress` at 0 renders the flat base colour.
 */
export function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = 'var(--psl-accent-ink)',
  shineColor = 'var(--psl-accent-shine)',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  delay = 0,
}: ShinyTextProps) {
  const reduceMotion = useReducedMotion()
  const [isPaused, setIsPaused] = useState(false)
  const progress = useMotionValue(0)
  const elapsedRef = useRef(0)
  const lastTimeRef = useRef<number | null>(null)
  const directionRef = useRef(direction === 'left' ? 1 : -1)

  const animationDuration = speed * 1000
  const delayDuration = delay * 1000
  const isStopped = disabled || reduceMotion

  useAnimationFrame((time) => {
    if (isStopped || isPaused) {
      lastTimeRef.current = null
      return
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time
      return
    }

    const deltaTime = time - lastTimeRef.current
    lastTimeRef.current = time

    elapsedRef.current += deltaTime

    if (yoyo) {
      const cycleDuration = animationDuration + delayDuration
      const fullCycle = cycleDuration * 2
      const cycleTime = elapsedRef.current % fullCycle

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100
        progress.set(directionRef.current === 1 ? p : 100 - p)
      } else if (cycleTime < cycleDuration) {
        progress.set(directionRef.current === 1 ? 100 : 0)
      } else if (cycleTime < cycleDuration + animationDuration) {
        const reverseTime = cycleTime - cycleDuration
        const p = 100 - (reverseTime / animationDuration) * 100
        progress.set(directionRef.current === 1 ? p : 100 - p)
      } else {
        progress.set(directionRef.current === 1 ? 0 : 100)
      }
    } else {
      const cycleDuration = animationDuration + delayDuration
      const cycleTime = elapsedRef.current % cycleDuration

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100
        progress.set(directionRef.current === 1 ? p : 100 - p)
      } else {
        // Delay phase — hold with the shine parked off-screen.
        progress.set(directionRef.current === 1 ? 100 : 0)
      }
    }
  })

  useEffect(() => {
    directionRef.current = direction === 'left' ? 1 : -1
    elapsedRef.current = 0
    progress.set(0)
    // `progress` is a MotionValue and stable for the life of the component, so
    // listing it satisfies the lint rule without ever re-running this.
  }, [direction, progress])

  // p=0 → 150% (shine off the right edge), p=100 → -50% (off the left).
  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`)

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true)
  }, [pauseOnHover])

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false)
  }, [pauseOnHover])

  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  )
}
