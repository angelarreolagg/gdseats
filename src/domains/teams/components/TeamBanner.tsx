import { motion } from 'motion/react'
import type { Team } from '../types/team.types'
import { TeamHelmet } from './TeamHelmet'

/**
 * One greyscale stadium for all 24 franchises — the plate the colours paint on.
 *
 * Shared on purpose: one request serves the whole grid, and because it carries no
 * colour of its own, the franchise palette is free to own the card. Cropped and
 * re-encoded to the band `object-cover` actually shows; the 2176px source it came
 * from is 5.7 MB, which is 75× this file for pixels no one ever sees.
 */
const STADIUM_PLATE = '/teams-bg.jpg'

interface TeamBannerProps {
  team: Team
  className?: string
  /** Drives the helmet's hover wiggle. */
  isHovered?: boolean
}

/**
 * The card's artwork: shared stadium, franchise colours laid over it.
 *
 * Two blend modes doing two different jobs. `multiply` tints — the plate is
 * greyscale, so multiplying by the primary keeps every stand, rail and stairwell
 * and stains the lot in the team's colour, which a flat overlay would have hidden.
 * `screen` on the secondary adds light back where the floodlights already are, so
 * the accent reads as the stadium being lit rather than as a sticker over it.
 *
 * `isolate` is load-bearing: without its own stacking context the multiply would
 * reach past the banner and darken the card surface underneath.
 *
 * The base colour matters for the moment before the image lands (and if it never
 * does) — a mid grey, so `multiply` resolves to roughly the same tint either way
 * instead of flashing a black box.
 */
export function TeamBanner({ team, className = '', isHovered = false }: TeamBannerProps) {
  return (
    <span className={`relative isolate block overflow-hidden bg-[#8b9095] ${className}`}>
      <img
        src={STADIUM_PLATE}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background: `linear-gradient(to bottom, ${team.primary} 0%, ${team.primary} 42%, #05070d 100%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: `radial-gradient(62% 74% at 50% 22%, ${team.secondary}59, transparent 72%)`,
        }}
      />
      {/*
       * Above the tints and outside them: the helmet is the franchise's mark, not
       * part of the plate, so blending it would stain it with its own colours.
       * The real logo lands on top of this — same stack as before the stadium.
       *
       * A plain 2D wiggle, deliberately: two earlier attempts at a 3D turn (a
       * `rotate` faked in SVG, then a real `rotateY` with perspective) both
       * looked wrong on a flat, solid-colour silhouette — there's no shading to
       * sell depth with, so a "turn" just warps the shape. A small `rotate` +
       * `scale` bounce plays to what a flat shape actually does well instead of
       * fighting it. `originX`/`originY: 0.5` rotate around this group's own
       * measured centre rather than the frame's, so it tilts in place.
       */}
      <svg
        viewBox="0 0 320 140"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <motion.g
          animate={{ rotate: isHovered ? -8 : 0, scale: isHovered ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 10 }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <TeamHelmet primary={team.primary} secondary={team.secondary} />
        </motion.g>
      </svg>
    </span>
  )
}
