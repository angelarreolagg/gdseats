# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`pslscout-demo` (the npm package name is historical — the product is **G&D Seats**, expanded to "Gridiron & Diamond Seats" only in the header tooltip) is a frontend-only demo of a secondary market for NFL personal seat licenses, with an AI valuation layer. All data is mocked; there is no backend.

The flow is: **pick a team → browse listings on a seat map → open a listing → read the AI verdict → make an offer.**

## Commands

Package manager is **pnpm**.

```bash
pnpm dev          # Vite dev server
pnpm build        # tsc -b (typecheck, project references) then vite build
pnpm lint         # eslint .
pnpm test         # vitest run
pnpm test:watch   # vitest
pnpm vitest run <pattern> --reporter=verbose   # single suite, with console output
```

## Architecture

Domain-driven, feature-first. Four domains plus a shell:

- `src/app/` — composition root. `useAppNavigation` holds screen state; no business rules.
- `src/domains/teams/` — franchise catalogue, the team grid, and the market-trend signal.
- `src/domains/listing/` — **owns the `Listing` entity**, the venue layout, the seat map, the generator, and the detail overlay.
- `src/domains/search/` — browse: toolbar, list rows, filter/sort.
- `src/domains/deal-analyzer/` — the AI verdict. Pure services plus `AIInsightPanel` and `DealBadge`.

**The dependency DAG is enforced by convention and must stay acyclic:**

```
teams → ∅        search → listing, deal-analyzer
listing → deal-analyzer, teams(types)        deal-analyzer → ∅
```

`SeatMap` lives in `listing/` (not `search/`) precisely because of this — it renders `venueLayout`, which `listing` owns, and both screens consume it. Check with:
`grep -rn "domains/search" src/domains/listing src/domains/deal-analyzer src/domains/teams` → must return nothing.

**The analyzer never estimates.** `estimatedPricePerSeat` is produced by `listing/services/listingGenerator.service.ts`, playing the role a backend would. `deal-analyzer` only evaluates a given estimate. Don't move pricing models into it.

`listing/services/listingSignals.service.ts` is the only place per-seat and total units meet: comparison is per seat, but the panel speaks in totals because the buyer offers a total.

Imports use the `@/` alias for `src/`.

## Service API

`deal-analyzer/services/pricing.service.ts`:

```ts
calculatePercentageDiff(listingPrice, estimatedPrice)  // (listing - est) / est, guards est = 0
getDealStatus(percentageDiff)                          // > +0.10 over, < -0.10 under, else fair
getRecommendation(status)                              // over→Wait, under→Buy, fair→Neutral
evaluateDeal(listingPrice, estimatedPrice)             // composed
```

Both ±10% boundaries land in `fair`. Negative difference = below market = good for the buyer. `ListingRow` and `AIInsightPanel` both call `evaluateDeal`, so a row's badge can never disagree with the detail it opens.

## Mock data

Everything is generated from a **seeded** PRNG (`shared/utils/seededRandom.ts`), never `Math.random()`. The seat map prints a per-section count next to the list it describes; unseeded data would reshuffle each render and make those two contradict each other.

`getListingCountForTeam(team)` lives in `teams/data/teams.ts` and is used by *both* the team card and the listing generator, so those counts agree by construction rather than by hand. It sits in `teams` (not in the generator) because `teams` must not import from `listing` — that edge was a real cycle once.

`teams/services/marketTrend.service.ts` produces the per-franchise trend: 12 seeded months of demand plus a 3-month forecast. Momentum is measured across the **forecast** horizon, since the card answers "what is about to happen". The catalogue currently splits 5 heating / 8 steady / 11 cooling — imbalance is seed luck, not design, but a test pins that all three directions appear so a reseed can't silently flatten the feature.

Generator invariants worth preserving (all covered by tests):
- The ask multiplier is **centred on 1.0** (`0.78–1.22`). An asymmetric range skews the whole market to one verdict — an earlier version sat at `0.78–1.34` and produced 58% "Overpriced", which undersells the product.
- Inventory is sized so **most of the 72 sections are populated**. A map with half its sections greyed out reads as broken, not sparse.
- `sectionAveragePerSeat` is measured across the generated set, not invented, so the insight bullet and the price-stats chart describe the same numbers.

## Design system — read before touching colour

Tokens live in `src/shared/styles/theme.css`, each annotated with its measured contrast against the surface it renders on. Colour decisions here are computed, not eyeballed — the `dataviz` skill ships `scripts/validate_palette.js`.

1. **Brand green `#a0f700` is 1.33:1 on white.** It is a dark-mode-native accent. In light mode it is only ever a fill behind dark ink (14.33:1); text and marks use darker steps of the same hue (`--psl-accent-ink` `#4f7d00`).
2. **Status never rides on colour alone.** Green vs amber is CVD ΔE 7.0 (deuteranopia); green vs red is ΔE 1.2 in light mode. Every status and tag pairs an emoji/glyph with a text label. `deal-analyzer/components/statusPresentation.ts`, `shared/components/Tag.tsx`, and `teams/services/marketTrend.service.ts` are the single definitions — don't bypass them.

**Colour does two different jobs here, and they use opposite conventions.** This looks like a bug until you know the split, so don't "harmonise" them:

| Role | Where | Convention |
|---|---|---|
| **Direction** — what the number did | `PriceHistoryTable` Change column, discount chips | **Financial**: red = fell, green = rose |
| **Market context** — where this sits | `StatusBadge`, `DealBadge` | **Verdict palette**: amber / blue / teal |
| **Buyer-relative** — is now a good time | team trend on `TeamCard` | green = good time to buy |
| **Prose** — supporting evidence | `InsightsList` bullets | **No colour** — icon + muted ink |

So a price cut is **red** in the history table (it went down) and the same listing reads **teal** as "Attractive value". They never collide because the insight bullets between them carry no colour at all.

**The verdict palette deliberately avoids green/amber/red.** Those read as pass/warn/fail, which frames a five-figure purchase as a hazard and costs conversion. Tokens are `--psl-above` (amber), `--psl-aligned` (blue), `--psl-attractive` (teal), stepped per mode like every other colour here. Teal is held ≥ ΔE 16 from the brand green so "attractive value" never reads as the CTA — do not "simplify" it back to `--psl-good`.

`marketTrend.service.test.ts` and `PriceHistoryTable.test.tsx` each pin their own side of this. **Known inconsistency:** the team-card trend still uses green/amber (buyer-relative) rather than the verdict palette; it was out of scope for the copy refactor.

## Tone — the panel is context, not a warning

`AIInsightPanel` sells trust, not caution. Labels are "Above market range" / "In line with market" / "Attractive value"; the stance is one suggestive sentence ("You may find better value by waiting"), never an imperative. Bullets are observational — "Price adjusted down 9%", not "dropped"; "revisions", not "cuts".

`getRecommendation()` returns a **semantic key** (`opportunity` / `aligned` / `patience`), never a phrase — the wording is conversion-sensitive product copy and lives in `RECOMMENDATION_COPY`, not in pricing logic. `AIInsightPanel.test.tsx` and `insights.service.test.ts` both assert a banned-words list; treat a failure there as a product regression, not a cosmetic one.

The section-average bullet keeps **the listing as its subject** ("Sits 14% above the section 143 average"). Rephrasing it around the comparables attaches a figure measured against the average to a sentence about something else.
3. **Tags use a short tone list on purpose.** The reference UI gives each amenity its own hue; measured, blue vs violet came out at ΔE 1.8 (CVD) and 10.1 (normal vision) — indistinguishable. Tags sit in a row so every pair is adjacent, capping usable hues at ~3. Colour encodes *class* (promoted / time-critical / price signal / neutral), not identity.
4. **The seat map's field is deliberately low-chroma.** A saturated pitch green would compete with the brand accent, which marks the selected section — the one thing on the map that must read as active.

Dark mode is class-based (`@custom-variant dark` in `theme.css`); Tailwind v4 defaults to a media query. The theme swaps entirely through CSS custom properties in `:root` / `.dark` — there are deliberately no `dark:` utilities in components, and SVG marks read `var(--psl-*)` directly so they follow the theme for free. `@theme inline` is required so utilities keep the `var()` reference.

**Dark-mode ratios are measured against the surface (`#0e1728`), not the page (`#040811`).** That pair replaced a neutral grey one in Aug 2026; every token gained contrast and none needed re-stepping, but **re-measure the whole dark column if the surface moves again** — the numbers in the comments are only true for that ground.

**`AppHeader` pins itself to the dark palette in both themes** via a `dark` class on the `<header>`. The brand mark is a fixed bright-green seat, and `#a0f700` is 1.33:1 on white, so a light header would swallow the logo. Because the theme is only custom properties, that one class re-resolves every token inside the subtree — the children need no special-casing. Don't "fix" the header to follow the theme without also shipping a second, dark-ink logo.

## Charts

`PriceStatsChart` is inline SVG, no chart dependency (Recharts was removed). It is an **emphasis** chart: the listing in question takes the accent, every peer recedes to the muted token, because the question is "where does mine land". The price history table above it is the table-view twin, so no value is chart-only.

## Team logos (ESPN)

Real franchise marks come from ESPN. `teams/data/teamLogos.ts` is **generated** — refresh with `pnpm logos:sync`, never hand-edit. The sync script is the only thing in the repo that knows the API exists; the app ships a static import and makes **zero runtime requests** for this, which keeps the first screen as deterministic as the rest of the seeded demo.

Three things that look like details and are not:

- **Never link the raw asset.** ESPN's stored files are wildly inconsistent — the Raiders' dark mark is 491 KB at 4096², a grid of 24 would be ~12 MB. `getTeamLogoUrl` routes everything through `a.espncdn.com/combiner/i?…&w=&h=` at 2× the rendered size, which brings that same mark to ~5 KB. The map therefore stores **paths**, not URLs; a test pins that.
- **`rel` is an unordered set**, not a positional array. Match with `includes`, never by index, and never assume `logos[0]` is the default.
- **`["full","dark"]` means "for dark backgrounds"** — it carries a light keyline so black marks (Raiders, Jets) survive `#040811`. Verified visually, not inferred from the name.

Our team ids *are* ESPN's abbreviations (`dal`, `sf`, `lv`, `jax`…), so the join needs no mapping table — the sync confirmed every published href matches the derived path exactly.

`TeamLogo` has two independent fallbacks to `TeamCrest`, because they fail for different reasons: no entry in the map (catalogue grew without a re-sync) and `onError` (CDN up but not serving). `teamLogo.service.test.ts` guards the first by asserting every team in `TEAMS` has a mark.

**`useIsDarkTheme` vs `useTheme`.** `useTheme` *sets* the theme — each instance writes localStorage and toggles the root class, so it is safe with exactly one consumer (`ThemeToggle`). Anything that only needs to *read* the theme uses `shared/hooks/useIsDarkTheme.ts`, which is `useSyncExternalStore` over a single MutationObserver. Don't call `useTheme` from list items.

## Icons and tooltips

Icons come from **lucide-react**; there are no emoji in the UI. Services must stay free of React, so **they emit a semantic icon *name*** (`TagIconName`, `TrendDirection`) and the component layer resolves it — `listing/components/tagPresentation.ts`, `teams/components/trendPresentation.ts`, `deal-analyzer/components/statusPresentation.ts`. Never import a component into a service to shortcut this.

Tooltips wrap **@radix-ui/react-tooltip** in `shared/components/Tooltip.tsx`. Hover tooltips never fire on touch, so **nothing may live only in a tooltip**: chips carry their own visible label, and the Total-cost breakdown repeats figures that `MakeAnOfferCard` shows as visible rows.

`Tag` takes `focusable` (default off). Chips inside `ListingRow` must stay non-focusable — the row is itself a `<button>`, and a focusable element nested in a button is invalid and would add hundreds of tab stops. `ListingSummaryCard` opts in, so the copy is keyboard-reachable somewhere.

Component tests must render via `@/test/utils`, not bare RTL — Radix Tooltip throws without its provider.

## Holographic treatment

Three classes in `styles/globals.css`, all **purely decorative**. They encode nothing and are exempt from the measured palette — don't try to validate their hues.

| Class | Where | Note |
|---|---|---|
| `.holo-ring` | `AIInsightPanel` | Rotating conic gradient masked to the border, plus a corner bloom. |
| `.holo-chip` | `DealBadge` | Same ring, faster and dimmer, no bloom. |
| `.holo-icon` | the `BrainCircuit` mark | `stroke: url(#psl-holo-stroke) currentColor` |

All three are masked or stroked so **the content surface stays solid** — every contrast ratio measured for the text still holds.

Two things that look odd but are load-bearing:

- **`.holo-icon`'s trailing `currentColor` is the SVG paint fallback.** If the gradient `<defs>` (rendered inside `AIInsightPanel`) ever fails to resolve, the icon falls back to the inherited colour instead of vanishing. Don't drop it.
- **`ListingRow` sets `content-visibility: auto`.** Roughly 170 rows each carry a `.holo-chip`; without it every one animates off-screen and scrolling stutters. If the effect is ever made heavier, re-check this first.

On `DealBadge` the iridescence is on the **border only** — the fill keeps the verdict tint and the text the verdict ink, so the rainbow never washes out the hue that carries the meaning.

## Conventions

- `tsconfig.app.json` has `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` — no enums, no parameter properties, `import type` for types. `baseUrl` is intentionally absent (deprecated in TS 6).
- Tests are co-located in `domains/*/tests/`. Each carries a comment stating what it validates **and why it matters commercially** — keep that convention.
- `src/test/setup.ts` forces reduced motion so animations don't hide content from jsdom queries, and stubs `ResizeObserver`.
