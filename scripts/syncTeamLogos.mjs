#!/usr/bin/env node
/**
 * Refreshes src/domains/teams/data/teamLogos.ts from ESPN.
 *
 * Run by hand — `pnpm logos:sync` — never in CI or on build. Logos change once
 * a decade; wiring this into `pnpm build` would only mean the build fails on the
 * day ESPN has an outage.
 *
 * ONE request to the list endpoint, not one per team. The per-team endpoint
 * returns the full team object (record, standings, venue, links) to hand over a
 * single href, so 24 of those is 24 round trips and megabytes downloaded to read
 * 24 strings. The list carries every franchise in one payload; the ones we don't
 * model are dropped in a filter and cost nothing.
 *
 * The generated file is committed, so the app never touches the network for this
 * — it ships a static import.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { TEAMS } from '../src/domains/teams/data/teams.ts'
import { TEAM_LOGOS } from '../src/domains/teams/data/teamLogos.ts'

/**
 * ESPN's public team list.
 *
 * An env var with a default, not a required one, and **not** a `VITE_` var:
 * nothing in the browser bundle ever reads this. It is fetched here, by hand, by
 * whoever runs `pnpm logos:sync`, and the answer is committed as
 * `teamLogos.ts` — which is the reason the app makes zero requests to ESPN's API
 * and the first screen stays as deterministic as the rest of the seeded demo.
 *
 * There is no secret to hide: the endpoint is unauthenticated and public. The
 * override exists so a mirror or a recorded fixture can be pointed at during
 * development without editing the script, and it defaults so that a fresh clone
 * needs no `.env` to run the one command that uses it.
 */
const ENDPOINT =
  process.env.ESPN_TEAMS_ENDPOINT ??
  'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams'
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/domains/teams/data/teamLogos.ts',
)

/** ESPN's `rel` is an unordered set of tags, so match by membership. */
function selectLogoHref(logos, variant) {
  const wanted = variant === 'dark' ? 'dark' : 'default'
  const has = (logo, ...tags) => tags.every((tag) => logo.rel?.includes(tag))

  return (
    logos.find((l) => l.href && has(l, 'full', wanted))?.href ??
    logos.find((l) => l.href && has(l, 'full', 'default'))?.href ??
    logos.find((l) => l.href)?.href ??
    null
  )
}

/** Store the CDN path, not the absolute URL — the service adds the combiner. */
function toPath(href) {
  if (!href) return null
  try {
    return new URL(href).pathname
  } catch {
    return href.startsWith('/') ? href : null
  }
}

function flattenTeams(payload) {
  return (payload.sports?.[0]?.leagues?.[0]?.teams ?? []).map((entry) => entry.team)
}

async function main() {
  process.stdout.write(`Fetching ${ENDPOINT}\n`)

  const response = await fetch(ENDPOINT, {
    headers: {
      // The bare fetch UA gets a 403 from ESPN's edge.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `ESPN returned ${response.status}. The existing teamLogos.ts is untouched.`,
    )
  }

  const espnTeams = flattenTeams(await response.json())
  process.stdout.write(`  ${espnTeams.length} franchises returned\n\n`)

  // Our team ids ARE ESPN's abbreviations, so the join needs no mapping table.
  const byAbbreviation = new Map(
    espnTeams.map((team) => [String(team.abbreviation ?? '').toLowerCase(), team]),
  )

  const entries = []
  const missing = []
  const changed = []

  for (const team of TEAMS) {
    const espn = byAbbreviation.get(team.id)
    if (!espn?.logos?.length) {
      missing.push(team.id)
      continue
    }

    const light = toPath(selectLogoHref(espn.logos, 'light'))
    const dark = toPath(selectLogoHref(espn.logos, 'dark')) ?? light
    if (!light) {
      missing.push(team.id)
      continue
    }

    const previous = TEAM_LOGOS[team.id]
    if (previous && (previous.light !== light || previous.dark !== dark)) {
      changed.push(`${team.id}: ${previous.light} -> ${light}`)
    }

    entries.push({ id: team.id, light, dark })
  }

  if (missing.length > 0) {
    process.stdout.write(`No logo published for: ${missing.join(', ')}\n`)
    process.stdout.write('These keep their current entry and fall back to TeamCrest.\n\n')
  }

  if (changed.length > 0) {
    process.stdout.write('Changed since last sync:\n')
    for (const line of changed) process.stdout.write(`  ${line}\n`)
    process.stdout.write('\n')
  } else {
    process.stdout.write('No paths changed.\n\n')
  }

  // Anything ESPN didn't return keeps whatever it had, so a partial response
  // cannot silently blank the map.
  const merged = { ...TEAM_LOGOS }
  for (const entry of entries) merged[entry.id] = { light: entry.light, dark: entry.dark }

  const body = Object.entries(merged)
    .map(
      ([id, paths]) =>
        `  ${id}: {\n    light: "${paths.light}",\n    dark: "${paths.dark}",\n  },`,
    )
    .join('\n')

  await writeFile(
    OUT,
    `/**
 * ESPN logo paths, keyed by OUR team id.
 *
 * GENERATED — refresh with \`pnpm logos:sync\`, don't hand-edit.
 *
 * Stored as CDN *paths*, not full URLs: \`teamLogo.service.ts\` wraps them in
 * ESPN's combiner to request the size actually rendered. Linking the raw asset
 * is not an option — the Raiders' dark mark is 491 KB at 4096², and a grid of
 * 24 would pull roughly 12 MB.
 *
 * \`light\` is ESPN's \`["full","default"]\`; \`dark\` is \`["full","dark"]\`, which
 * carries a light keyline so black marks survive a dark ground.
 *
 * Our team ids are ESPN's abbreviations, so there is no mapping table.
 */
export interface TeamLogoPaths {
  light: string
  dark: string
}

export const TEAM_LOGOS: Record<string, TeamLogoPaths> = {
${body}
}
`,
    'utf8',
  )

  process.stdout.write(`Wrote ${entries.length} entries to ${OUT}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
})
