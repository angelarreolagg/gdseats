import { motion, useReducedMotion } from 'motion/react'

/** Resting heights, in px. Uneven on purpose — five equal bars read as a
 *  loading spinner rather than as a voice. */
const BARS = [7, 12, 16, 10, 6]

/**
 * The little equaliser next to "Scout is available now" — the cue that the line
 * is live rather than a picture of a phone number.
 *
 * Purely decorative and `aria-hidden`: "available now" is already stated in
 * text beside it, so nothing here is the only carrier of anything.
 *
 * **The reduced-motion branch is hand-rolled, and has to be.** `MotionConfig
 * reducedMotion="user"` suppresses transform animations by jumping them to
 * their end state — and the end of a `scaleY: [0.4, 1, 0.4]` keyframe loop is
 * `0.4`, so honouring the setting through Motion alone would leave a reader
 * with a row of permanently squashed stubs and no explanation. Same class of
 * problem as the hero's `<video autoPlay>`: the global config governs how
 * animations run, not whether a component should be animating at all.
 */
export function VoiceBars() {
  const reduceMotion = useReducedMotion()

  return (
    <span aria-hidden="true" className="flex h-4 items-center gap-[3px]">
      {BARS.map((height, index) =>
        reduceMotion ? (
          <span
            key={index}
            style={{ height }}
            className="w-[3px] rounded-full bg-accent-ink/70"
          />
        ) : (
          <motion.span
            key={index}
            style={{ height }}
            // `scaleY` rather than `height`: a transform is composited, and
            // this loops forever a few hundred pixels from a 6 MB video.
            animate={{ scaleY: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: 'easeInOut',
              // Neighbours must not pulse in lockstep or the row reads as one
              // bar stretched wide. Offsetting each by an eighth of the cycle
              // sends a wave left to right.
              delay: index * 0.14,
            }}
            className="w-[3px] rounded-full bg-accent-ink/70"
          />
        ),
      )}
    </span>
  )
}
