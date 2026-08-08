import { TeamHelmet } from './TeamHelmet'

interface TeamCrestProps {
  primary: string
  secondary: string
  /** Distinct gradient ids per instance. */
  seed: string
  className?: string
}

/**
 * Generated card artwork: a helmet silhouette lit from behind, in the franchise's
 * own colours. There are no team image assets in this demo, and an inline SVG is
 * both CSP-safe and themeable — a broken <img> would look worse than no image.
 */
export function TeamCrest({ primary, secondary, seed, className = '' }: TeamCrestProps) {
  const bg = `crest-bg-${seed}`
  const glow = `crest-glow-${seed}`

  return (
    <svg
      viewBox="0 0 320 140"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.92" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="28%" r="60%">
          <stop offset="0%" stopColor={secondary} stopOpacity="0.55" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="140" fill={`url(#${bg})`} />
      <rect width="320" height="140" fill={`url(#${glow})`} />

      {/* Stadium light bars raking across the frame. */}
      <g opacity="0.28">
        <rect x="-20" y="18" width="360" height="2" fill={secondary} transform="rotate(-6 160 70)" />
        <rect x="-20" y="112" width="360" height="2" fill={secondary} transform="rotate(-6 160 70)" />
      </g>

      <TeamHelmet primary={primary} secondary={secondary} />
    </svg>
  )
}
