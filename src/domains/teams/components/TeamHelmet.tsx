interface TeamHelmetProps {
  primary: string
  secondary: string
}

/**
 * The generated helmet mark, in the franchise's own colours.
 *
 * Emitted as a bare `<g>` rather than its own `<svg>` so both callers can place
 * it in their own frame: `TeamCrest` draws it over generated artwork when a real
 * logo is unavailable, and `TeamBanner` lays it over the stadium plate. One
 * definition, because a path string copied into two files drifts the first time
 * anyone nudges it.
 *
 * The coordinates assume a 320×140 viewBox — it is translated to that frame's
 * centre, so the parent must use the same one.
 */
export function TeamHelmet({ primary, secondary }: TeamHelmetProps) {
  return (
    <g transform="translate(160 78)">
      <path
        d="M-46 4c0-26 20-44 46-44 24 0 42 14 46 34 1 6-2 10-8 10h-18l6 14c2 5-1 10-7 10h-38c-16 0-27-10-27-24Z"
        fill={secondary}
        opacity="0.9"
      />
      <path
        d="M-46 4c0-26 20-44 46-44 10 0 19 3 26 8-30 2-52 22-52 48 0 5 1 9 3 12h-4c-12-2-19-11-19-24Z"
        fill="#ffffff"
        opacity="0.18"
      />
      {/* Facemask. */}
      <g stroke={primary} strokeWidth="3.2" strokeLinecap="round" opacity="0.75" fill="none">
        <path d="M-14 18h30" />
        <path d="M-10 26h22" />
      </g>
    </g>
  )
}
