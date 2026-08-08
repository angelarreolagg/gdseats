/**
 * ESPN logo paths, keyed by OUR team id.
 *
 * GENERATED — refresh with `pnpm logos:sync`, don't hand-edit.
 *
 * Stored as CDN *paths*, not full URLs: `teamLogo.service.ts` wraps them in
 * ESPN's combiner to request the size actually rendered. Linking the raw asset
 * is not an option — the Raiders' dark mark is 491 KB at 4096², and a grid of
 * 24 would pull roughly 12 MB.
 *
 * `light` is ESPN's `["full","default"]`; `dark` is `["full","dark"]`, which
 * carries a light keyline so black marks survive a dark ground.
 *
 * Our team ids are ESPN's abbreviations, so there is no mapping table.
 */
export interface TeamLogoPaths {
  light: string
  dark: string
}

export const TEAM_LOGOS: Record<string, TeamLogoPaths> = {
  dal: {
    light: "/i/teamlogos/nfl/500/dal.png",
    dark: "/i/teamlogos/nfl/500-dark/dal.png",
  },
  sf: {
    light: "/i/teamlogos/nfl/500/sf.png",
    dark: "/i/teamlogos/nfl/500-dark/sf.png",
  },
  lv: {
    light: "/i/teamlogos/nfl/500/lv.png",
    dark: "/i/teamlogos/nfl/500-dark/lv.png",
  },
  min: {
    light: "/i/teamlogos/nfl/500/min.png",
    dark: "/i/teamlogos/nfl/500-dark/min.png",
  },
  bal: {
    light: "/i/teamlogos/nfl/500/bal.png",
    dark: "/i/teamlogos/nfl/500-dark/bal.png",
  },
  car: {
    light: "/i/teamlogos/nfl/500/car.png",
    dark: "/i/teamlogos/nfl/500-dark/car.png",
  },
  atl: {
    light: "/i/teamlogos/nfl/500/atl.png",
    dark: "/i/teamlogos/nfl/500-dark/atl.png",
  },
  hou: {
    light: "/i/teamlogos/nfl/500/hou.png",
    dark: "/i/teamlogos/nfl/500-dark/hou.png",
  },
  lar: {
    light: "/i/teamlogos/nfl/500/lar.png",
    dark: "/i/teamlogos/nfl/500-dark/lar.png",
  },
  nyg: {
    light: "/i/teamlogos/nfl/500/nyg.png",
    dark: "/i/teamlogos/nfl/500-dark/nyg.png",
  },
  sea: {
    light: "/i/teamlogos/nfl/500/sea.png",
    dark: "/i/teamlogos/nfl/500-dark/sea.png",
  },
  gb: {
    light: "/i/teamlogos/nfl/500/gb.png",
    dark: "/i/teamlogos/nfl/500-dark/gb.png",
  },
  phi: {
    light: "/i/teamlogos/nfl/500/phi.png",
    dark: "/i/teamlogos/nfl/500-dark/phi.png",
  },
  kc: {
    light: "/i/teamlogos/nfl/500/kc.png",
    dark: "/i/teamlogos/nfl/500-dark/kc.png",
  },
  den: {
    light: "/i/teamlogos/nfl/500/den.png",
    dark: "/i/teamlogos/nfl/500-dark/den.png",
  },
  lac: {
    light: "/i/teamlogos/nfl/500/lac.png",
    dark: "/i/teamlogos/nfl/500-dark/lac.png",
  },
  nyj: {
    light: "/i/teamlogos/nfl/500/nyj.png",
    dark: "/i/teamlogos/nfl/500-dark/nyj.png",
  },
  buf: {
    light: "/i/teamlogos/nfl/500/buf.png",
    dark: "/i/teamlogos/nfl/500-dark/buf.png",
  },
  mia: {
    light: "/i/teamlogos/nfl/500/mia.png",
    dark: "/i/teamlogos/nfl/500-dark/mia.png",
  },
  chi: {
    light: "/i/teamlogos/nfl/500/chi.png",
    dark: "/i/teamlogos/nfl/500-dark/chi.png",
  },
  ne: {
    light: "/i/teamlogos/nfl/500/ne.png",
    dark: "/i/teamlogos/nfl/500-dark/ne.png",
  },
  ten: {
    light: "/i/teamlogos/nfl/500/ten.png",
    dark: "/i/teamlogos/nfl/500-dark/ten.png",
  },
  ari: {
    light: "/i/teamlogos/nfl/500/ari.png",
    dark: "/i/teamlogos/nfl/500-dark/ari.png",
  },
  jax: {
    light: "/i/teamlogos/nfl/500/jax.png",
    dark: "/i/teamlogos/nfl/500-dark/jax.png",
  },
}
