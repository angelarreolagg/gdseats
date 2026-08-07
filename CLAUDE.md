# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`pslscout-demo` is a frontend-only demo of PSL Scout — a secondary market for NFL personal seat licenses, with an AI valuation layer. All data is mocked; there is no backend.

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
- `src/domains/teams/` — franchise catalogue and the team grid.
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

`getListingCountForTeam(team)` is a pure function used by *both* the team card and the generator, so those counts agree by construction rather than by hand.

Generator invariants worth preserving (all covered by tests):
- The ask multiplier is **centred on 1.0** (`0.78–1.22`). An asymmetric range skews the whole market to one verdict — an earlier version sat at `0.78–1.34` and produced 58% "Overpriced", which undersells the product.
- Inventory is sized so **most of the 72 sections are populated**. A map with half its sections greyed out reads as broken, not sparse.
- `sectionAveragePerSeat` is measured across the generated set, not invented, so the insight bullet and the price-stats chart describe the same numbers.

## Design system — read before touching colour

Tokens live in `src/shared/styles/theme.css`, each annotated with its measured contrast against the surface it renders on. Colour decisions here are computed, not eyeballed — the `dataviz` skill ships `scripts/validate_palette.js`.

1. **Brand green `#a0f700` is 1.33:1 on white.** It is a dark-mode-native accent. In light mode it is only ever a fill behind dark ink (14.33:1); text and marks use darker steps of the same hue (`--psl-accent-ink` `#4f7d00`).
2. **Status never rides on colour alone.** Green vs amber is CVD ΔE 7.0 (deuteranopia); green vs red is ΔE 1.2 in light mode. Every status and tag pairs an emoji/glyph with a text label. `deal-analyzer/components/statusPresentation.ts` and `shared/components/Tag.tsx` are the single definitions — don't bypass them.
3. **Tags use a short tone list on purpose.** The reference UI gives each amenity its own hue; measured, blue vs violet came out at ΔE 1.8 (CVD) and 10.1 (normal vision) — indistinguishable. Tags sit in a row so every pair is adjacent, capping usable hues at ~3. Colour encodes *class* (promoted / time-critical / price signal / neutral), not identity.
4. **The seat map's field is deliberately low-chroma.** A saturated pitch green would compete with the brand accent, which marks the selected section — the one thing on the map that must read as active.

Dark mode is class-based (`@custom-variant dark` in `theme.css`); Tailwind v4 defaults to a media query. The theme swaps entirely through CSS custom properties in `:root` / `.dark` — there are deliberately no `dark:` utilities in components, and SVG marks read `var(--psl-*)` directly so they follow the theme for free. `@theme inline` is required so utilities keep the `var()` reference.

## Charts

`PriceStatsChart` is inline SVG, no chart dependency (Recharts was removed). It is an **emphasis** chart: the listing in question takes the accent, every peer recedes to the muted token, because the question is "where does mine land". The price history table above it is the table-view twin, so no value is chart-only.

## Conventions

- `tsconfig.app.json` has `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` — no enums, no parameter properties, `import type` for types. `baseUrl` is intentionally absent (deprecated in TS 6).
- Tests are co-located in `domains/*/tests/`. Each carries a comment stating what it validates **and why it matters commercially** — keep that convention.
- `src/test/setup.ts` forces reduced motion so animations don't hide content from jsdom queries, and stubs `ResizeObserver`.
