import { motion, useReducedMotion } from 'motion/react'

/**
 * The delay map in tenths of a second. Read as a shape: the ends start together
 * and the pulse travels inward, where a monotonic ramp would march one way like
 * a loading bar. Duplicated values are why it is keyed by index.
 */
const DELAY_STEPS = [0, 1, 2, 3, 4, 3, 2, 1, 0]

/** Resting and peak bar heights, px. The 3× ratio is what makes the motion read. */
const MIN_HEIGHT = 8
const MAX_HEIGHT = 24

/**
 * The equaliser beside "Scout is available now" — the cue that the line is live
 * rather than a picture of a phone number.
 *
 * Purely decorative and `aria-hidden`: the availability is already stated in
 * text next to it, so nothing here is the only carrier of anything.
 *
 * **It animates `height`, not `scaleY`, and that is deliberate.** A transform
 * would be composited and cheaper, but the bars are `rounded-full` — scaling a
 * pill vertically stretches its end caps into ellipses, so the bars would
 * visibly deform as they moved. Animating height keeps the caps circular
 * because a border radius is resolved in absolute units. Nine small boxes
 * relaying out on a landing card is a cost worth paying for that; it would not
 * be inside a long list (see `ListingRow`'s `content-visibility` note).
 *
 * **The reduced-motion branch is hand-rolled, and with `height` it has to be
 * even more than it did with a transform.** `MotionConfig reducedMotion="user"`
 * governs transform and layout animations only — it has no opinion about
 * `height`, so left to the global config this would keep bouncing forever for
 * someone who explicitly asked the system for no movement. The static branch
 * renders the wave's silhouette instead: the same symmetric profile, held still,
 * so it still reads as audio rather than as a row of identical dots.
 */
export function SymmetricWave() {
  const reduceMotion = useReducedMotion()

  return (
    <span aria-hidden="true" className="flex h-6 shrink-0 items-center gap-[3px]">
      {DELAY_STEPS.map((step, index) =>
        reduceMotion ? (
          <span
            key={index}
            // The delay map doubles as a height map: it already describes the
            // shape the moving version traces, so the still frame is the wave
            // paused at its widest rather than a flat line.
            style={{ height: MIN_HEIGHT + step * 4 }}
            className="w-[3px] rounded-full bg-accent-ink/70"
          />
        ) : (
          <motion.span
            key={index}
            animate={{ height: [MIN_HEIGHT, MAX_HEIGHT, MIN_HEIGHT] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: step * 0.1,
            }}
            className="w-[3px] rounded-full bg-accent-ink/70"
          />
        ),
      )}
    </span>
  )
}
