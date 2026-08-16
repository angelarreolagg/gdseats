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

- `src/app/` — composition root. `useAppNavigation` holds screen state; no business rules. It also does the one thing a router would have given us free: **`window.scrollTo(0, 0)` on every screen change**, since screens swap in place and otherwise inherit the previous one's offset. The listing overlay is deliberately excluded — closing it must return the buyer to the row they opened.
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

`MarketTrend.series` is no longer rendered — the sparkline was removed because at 84×30 it answered nothing the chip didn't. It is **not dead data**: `momentum` is derived from it, and `getTrendExplanation` counts its projected points to state its own horizon, so the tooltip's "over the next N months" can never drift from the forecast it describes. Its points carry a `monthIndex` rather than a `label`, because a month name is copy and this layer holds none — if a chart ever comes back, the axis formats the index.

`TrendChip` (`teams/components/`) is the whole feature now — icon + label + momentum, with the reasoning in a tooltip. It takes `focusable` for the same reason `Tag` does: `TeamCard` is a `<button>`, so the chip must not take a tab stop there; `SearchToolbar` opts in so the copy is keyboard-reachable somewhere. A steady market omits the percentage, since it rounds to "0%" and reads as missing data.

**Dates in generated data are epoch ms, never display strings.** `Listing.publicationDateMs` and `PriceHistoryEntry.dateMs` are built with `Date.UTC` and formatted at render by `formatListingDate` / `formatShortDate`. They used to be generated English (`"Jul 22, 2026"`, from a `MONTHS` array), which is untranslatable where it sits — and it left `listingSignals.service.ts` shortening them with `date.split(',')[0]`, an assumption about US comma placement that produces nonsense in three of the four locales: es and pt-BR have no comma to split on, and ja writes the year first, so the "short" date was the year alone. That function is gone. The formatters pin `timeZone: 'UTC'`, since these are calendar dates rather than instants — without it a reader west of Greenwich sees every listing published a day earlier than the row above says it was.

Generator invariants worth preserving (all covered by tests):
- The ask multiplier is **centred on 1.0** (`0.78–1.22`). An asymmetric range skews the whole market to one verdict — an earlier version sat at `0.78–1.34` and produced 58% "Overpriced", which undersells the product.
- Inventory is sized so **most of the 72 sections are populated**. A map with half its sections greyed out reads as broken, not sparse.
- `sectionAveragePerSeat` is measured across the generated set, not invented, so the insight bullet and the price-stats chart describe the same numbers.
- `ListingTag` carries a `labelKey` (plus `labelParams` for the one tag with a figure in it), never a phrase. Same rule as `iconName`, and see the Internationalisation section.

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

`getRecommendation()` returns a **semantic key** (`opportunity` / `aligned` / `patience`), never a phrase — the wording is conversion-sensitive product copy. `statusPresentation.ts` maps that key to a *translation* key (`RECOMMENDATION_KEY`) and the sentence itself lives in `analyzer.json`, so it appears in neither the pricing logic nor the presentation layer. `AIInsightPanel.test.tsx` asserts a banned-words list through the rendered UI, and `i18n.locales.test.ts` asserts one against the `en` bundle directly; treat a failure in either as a product regression, not a cosmetic one. `insights.service.test.ts` no longer holds that guard — the service holds no words to guard.

The section-average bullet keeps **the listing as its subject** ("Sits 14% above the section 143 average"). Rephrasing it around the comparables attaches a figure measured against the average to a sentence about something else.
3. **Tags use a short tone list on purpose.** The reference UI gives each amenity its own hue; measured, blue vs violet came out at ΔE 1.8 (CVD) and 10.1 (normal vision) — indistinguishable. Tags sit in a row so every pair is adjacent, capping usable hues at ~3. Colour encodes *class* (promoted / time-critical / price signal / neutral), not identity.
4. **The seat map's field is deliberately low-chroma.** A saturated pitch green would compete with the brand accent, which marks the selected section — the one thing on the map that must read as active.

Dark mode is class-based (`@custom-variant dark` in `theme.css`); Tailwind v4 defaults to a media query. The theme swaps entirely through CSS custom properties in `:root` / `.dark` — there are deliberately no `dark:` utilities in components, and SVG marks read `var(--psl-*)` directly so they follow the theme for free. `@theme inline` is required so utilities keep the `var()` reference.

**Dark-mode ratios are measured against the surface (`#0e1728`), not the page (`#040811`).** That pair replaced a neutral grey one in Aug 2026; every token gained contrast and none needed re-stepping, but **re-measure the whole dark column if the surface moves again** — the numbers in the comments are only true for that ground.

**Two surfaces pin themselves to the dark palette in both themes** via a `dark` class on their root — `AppHeader` and `TeamsHero`. Because the theme is only custom properties, that one class re-resolves every token inside the subtree, so their children need no special-casing. The reasons differ: the header's brand mark is a fixed bright-green seat and `#a0f700` is 1.33:1 on white, so a light bar would swallow the logo — don't "fix" it to follow the theme without also shipping a second, dark-ink logo. The hero's type sits on stadium footage that is dark whatever the user picked.

**A consequence, now that the header has a popover:** `LanguageSwitch`'s list renders inside that dark subtree, so it resolves dark tokens even on a light page. That is intentional — a dark menu hanging off a dark bar is how navigation menus normally behave, and it uses the same `bg-surface` / `border-border-hairline` / `text-ink` tokens as `TeamSearchCombobox`'s listbox, so it needs no `dark:` utility. If it ever has to follow the page instead, the fix is **not** a `dark:` variant (there are deliberately none in components) — it would need a `.light` scope class in `theme.css` re-declaring the light values, which is a design-system change.

## Hero

`teams/components/TeamsHero.tsx` is the landing band: `src/assets/hero-stadiums.mp4` under a scrim, the brand glow, and the bottom fade — one component, because those layers only mean anything together.

**The footage is an `import`, not a `public/` path, and that is a caching decision.** Vite fingerprints imported assets, and only a fingerprinted name can safely be served `immutable` — the URL changes whenever the bytes do, so a stale copy is impossible. `vercel.json` grants `public, max-age=31536000, immutable` to `/assets/*`; the import is what makes the video eligible, which is what makes a repeat visit cost zero bytes and zero round trips. Moving it back to `public/` for convenience would look identical in dev and quietly charge every returning visitor a full revalidation — `TeamsHero.test.tsx` pins the import so that stays loud.

The `<video>` carries a `<source>` rather than a `src`, so further encodes (AV1 first, a narrow cut behind `media`) drop in above the current line without restructuring, and so a browser can reject a codec before spending a request. **`HERO_CODEC` was read out of the file's `avcC` box** (`avc1.640028` — High profile, level 4.0), not guessed: a browser that cannot decode the advertised codec skips the source **silently**, and with one source that is an empty hero with no error anywhere. Re-read it from the file on any re-encode. `preload` is `auto`, not `metadata` — `autoPlay` overrides `preload` regardless, so `metadata` only ever misdescribed the element.

`index.html` preloads the video so the fetch starts during HTML parse instead of after React mounts. **Its `href` points at the source path (`/src/assets/…`) on purpose** — Vite rewrites it to the fingerprinted filename at build, which is the only thing guaranteeing the hint and the `<source>` name the same URL; a hand-written `/assets/` path becomes a second, wasted download the moment the hash moves. `as="video"` is honoured unevenly (media loads take a separate path in some engines); it is free where ignored, and `rel="prefetch"` is the quieter fallback.

**Still unoptimised, and by a lot:** the file is 6.2 MB — 1920×1080, 30 s, 30 fps, with a **478 KB audio track on an element that is `muted` and `aria-hidden`**, and its `moov` atom sits at the *end*, so the browser needs a second range request for the tail before it can decode anything. None of that is addressed above; the delivery work only ensures the 6.2 MB is fetched once, early, and never again. Re-encoding (`-movflags +faststart`, `-an`, an 8 s trim, 960-wide, pre-blurred under the 65% scrim) is the ~93% win and is still outstanding.

- **The green radial is the original hero, not decoration.** Before the video, the scrim and glow *were* the band. Keeping them means it reads as this product while a 6 MB file streams, and there is no flash of bare footage. It looks like a leftover of the old design; it isn't.
- **The headline is a `children` slot** with the built-in copy as the fallback, so a bespoke title takes over without touching the backdrop. The default fills it with `StrokeText`.
- **The height is `clamp(300px,40svh,520px)`, not a fixed band.** The first row of team cards has to stay fully visible without scrolling — a fixed height clipped it the moment the window got shorter. `svh`, not `vh`, or mobile sizes the hero against a viewport that includes address-bar chrome which then retracts. The real floor is the content (the `<h1>` is a fixed `fontSize × 1.3` = 166px), so `py` is the only lever left on short screens — which is why mobile takes `py-8` and only `sm:` gets `py-16`. **40svh is the reference site's own hero proportion**, arrived at by measuring it rather than by taste; it was 50svh and the band ate the fold on a phone.
- **The copy under the headline waits for it.** Both lines hold at `opacity 0` until `headlineSettles(lead, tail)` — when StrokeText's outline and wipe have both landed, 2.6s for the English — then rise in on two beats 0.14s apart so they arrive in reading order: **promise, then detail**. It is **computed, not typed in**: the wordmark is translated, so the glyph count moves with the language (Japanese is half the length), and a hand-tuned constant would leave the value proposition sitting invisible for a beat after the draw had already finished. The delay collapses to 0 under reduced motion, because StrokeText jumps to its end state there. `MotionConfig reducedMotion="user"` drops the transform by itself but has no opinion about delays.
- **The hero no longer carries a demo disclosure** (removed Aug 2026, by request). It used to sit above the value proposition as a low-volume chip — a 6px accent dot and `text-muted` words rather than a second `DemoMarker` pill — and it stated the disclosure outright *because* `AppHeader`'s version hides the detail in a tooltip, and hover never fires on touch. **That gap is now live: on a phone there is no visible statement anywhere that the prices are invented**, only the header's "Demo version" label with its explanation behind hover. If a disclosure ever has to come back, it belongs above the "easy, transparent, and secure way to buy" line, in DOM order, for the same reason it did before.
- **No bottom border, on purpose.** The fade to `--psl-page` already lands on the same `#040811` the page paints below, so in dark the join is invisible — a hairline border was the only thing drawing a seam. In light the dark band ends on a crisp edge against `#fbfbfa`, which is what the reference does too.
- **`autoPlay` is gated on `useReducedMotion()` by hand.** `MotionConfig` only governs Motion components and the `prefers-reduced-motion` block in `globals.css` only damps CSS animation — neither stops a looping `<video>`. `src/test/setup.ts` forces reduced motion, so jsdom never tries to play it either.
- `muted` reflects as a **DOM property**, not an attribute; assert `video.muted`, not `toHaveAttribute('muted')`.

- **The wordmark is TRANSLATED** (`hero:wordmark.lead` / `.tail`), and it is **one `StrokeText` for the whole phrase from `sm` up**, two stacked below it. Unchanged in shape from before the translation; what changed is where the two-tone split comes from.
- **One component on the wide layout is load-bearing, because one component is one GSAP timeline.** That is what draws the headline as a single left-to-right sweep. Rendering the lead and tail as two components makes the tint trivial — each paints its own colour — and gives each its own timeline, both starting at zero: the halves then sweep *simultaneously* and the headline animates as two separate texts. That looks correct in a screenshot and wrong in motion; it shipped that way once and was reported immediately. The stacked layout is two components because it is two lines, on separate rows, where nothing reads as one line drawing twice.
- **The two-tone split is applied imperatively, by `useWordmarkTint`.** It sets `stroke`/`fill` on the first `lead.length` tspans in a layout effect. This replaced `.hero-wordmark`'s `nth-child(-n + 10)`, whose count was hard-coded to "SOME SEATS" — CSS cannot read the copy, so it could not survive translation. It is safe against the animation (GSAP only ever writes `strokeDashoffset`/`strokeDasharray` and `opacity`, never `stroke` or `fill`) and against React (StrokeText keys its tspans by index and re-renders them only when the text changes, which is when the effect re-runs). Clearing to `''` rather than the accent literal lets the rest fall back to the `<text>` presentation attribute, so the accent is stated in exactly one place.
- **The stacked lines are sized from a measured width.** `measureUnits` measures each line on a canvas in the same font; each line then takes that share of the column, so both render at **one glyph size**. Two full-width lines each render at whatever size their own length dictates — invisible while the halves were "SOME SEATS" and "MEAN MORE", stark once translated: Spanish's 16-glyph lead against a 9-glyph tail drew the second line at nearly twice the first. **jsdom has no 2D canvas context**, so it falls back to the glyph count — fine, since there is no rendered size there to be wrong about.
- The `<h1>` carries `aria-label={lead + ' ' + tail}` so the accessible name is identical in both layouts rather than depending on how `role="img"` children concatenate — which matters most in Japanese, where the two halves have no space between them and would otherwise be announced run together.
- **Only the one-line branch uses the glyph-count tint.** The split branch gives each line its own `strokeColor`/`fillColor`, so `nth-child(-n + 10)` is not involved and cannot cut a rewritten headline mid-word there. `TeamsHero.test.tsx` pins both halves of that.

`shared/components/StrokeText.tsx` is **vendored from React Bits** (TS + Tailwind variant) and stays close to upstream so it can be re-synced. Two edits, and only two: a `type` import for `CSSProperties`, which `verbatimModuleSyntax` requires, and the wipe fix below. **A re-sync has to re-apply the wipe fix or the hero headline breaks on every phone.**

**`fillMode="wipe"` no longer uses a `<clipPath>`, and must not go back to one.** Upstream hides the fill `<text>` behind a clip path whose `<rect>` is animated across it, leaving the fill itself at `opacity: 1`. **Mobile WebKit does not re-render a clip when the referenced geometry changes.** The initial state is honoured — so the headline correctly starts empty — but the animation never repaints, and the fill arrives as a single pop when something else finally forces one. Verified on a real iPhone across two attempts: starting the rect at `width="0"` and starting it full-width and sliding it in both failed the same way. There is no call-site workaround; the whole mechanism is internal.

The wipe is now built from the one primitive that demonstrably repaints on those devices — **per-glyph `opacity`**, the same thing the stroke draw already relies on. Each `[data-fill-char]` gets a short ramp on a tight left-to-right stagger, overlapping by roughly two characters so the leading edge reads as a travelling wipe rather than as letters popping on. The spacing is *solved* rather than picked: `each = (fillDuration − glyphDuration) / (glyphs − 1)`, so the last glyph lands exactly on `fillDuration` and the total stays inside the window `TeamsHero`'s `headlineSettles()` computes. A glyph is the smallest unit the edge can land on — acceptable here, and the reason `fontSize` and glyph count are worth a look if the headline is ever rewritten much longer or shorter. `fillMode="fade"` is untouched and still brings the string up together.

Other local adjustments do go at the call site: `TeamsHero` overrides the component's inline SVG height with `[&>span>svg]:!h-auto`, because the fixed `fontSize × 1.3` box letterboxes the wordmark on a narrow screen instead of scaling it. It draws in the raw brand green — legal here and nowhere else, since the hero is pinned dark. It brings `gsap` (~57 kB gz), the only dependency in the repo added for a single component.

**The wordmark opts out of `--font-sans`, and must.** `system-ui` is SF Pro on macOS, whose heavy glyphs are assembled from *overlapping component contours* — the diagonal of an N, the apex of an A, the middle of an M are separate shapes laid over the stems. Filled, nonzero winding merges them and nothing shows. `StrokeText` **strokes** the outline, so every internal edge is drawn and those diagonals stick out of the stems as loose slivers. The fix is a font with merged outlines (`'Helvetica Neue', Helvetica, Arial`), passed as `style` — `StrokeText` puts `style` on its root span and its `<text>` sets only size/weight/tracking, so `font-family` inherits and the vendored file stays untouched. Any replacement font must be checked the same way: **stroke the string and look at M, N, A, W**, don't trust how it looks filled.

**The stack ends `'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP'`, and those are what let the wordmark be translated.** Font fallback is per glyph, so Latin copy never reaches them and the Latin rendering is untouched; Japanese falls through to a face with the coverage. They were added by the same test the Latin stack was chosen by — stroked and looked at, not trusted on the name — and CJK outlines came out clean. `TeamsHero.test.tsx` asserts the CJK entries are still there, because dropping them looks like tidying a long string and would silently hand Japanese to whatever the browser picked.

**The wordmark is two-tone, and the split is derived from the copy, not from a glyph count.** `StrokeText` paints one `strokeColor` / `fillColor` per string, so the split has always come from outside. It used to be `.hero-wordmark`, retinting the first 10 `<tspan>`s with `--psl-wordmark-lead` via `nth-child(-n + 10)` — elegant, `!important`-free (tspans only *inherit* stroke and fill, and a CSS declaration outranks an inherited presentation attribute), and coupled to one fixed English string. **CSS can't read the copy**, so translating the headline would have cut the tint mid-word in three languages. It is now `useWordmarkTint`, a layout effect keyed on `lead.length`. `globals.css` keeps a comment where the rule was, saying not to bring it back — and the reason the obvious alternative (two components, two colours as props) is wrong is the animation, not the tint. See the Hero section.

**The wordmark's fill starts hidden in CSS, and that is what makes the draw visible at all.** `StrokeText`'s `wipe` mode leaves the fill `<text>` at full opacity and conceals it *only* with a `<clipPath>` — which the component renders conditionally on its `getBBox()` measurement having landed. Every frame before that, the headline paints solid, and since `TeamsHero` passes the same colour as both `strokeColor` and `fillColor`, a solid fill erases the stroke drawing underneath it. `.wordmark-draw` in `globals.css` holds `[data-fill-char]` at `opacity: 0`; GSAP writes opacity inline the moment it arms the timeline (1 for the wipe, 1 again on the reduced-motion end state) and an inline style outranks the rule, so it covers those frames and nothing after. It sits on the `<h1>` and therefore covers both layouts; `TeamsHero.test.tsx` pins the gate at both widths.

**The headline is SVG glyph outlines, so it is a picture to a screen reader.** `StrokeText` labels itself `role="img"` + `aria-label`, and the `<h1>` takes its accessible name from that. The two lines under it stay real text — they are the value proposition, and they have to be selectable and translatable.

## Landing sections

Everything below the team grid lives in `app/components/landing/`, composed by `LandingSections` and rendered **inside `App`'s teams branch** — not beside the two screens, or an FAQ would appear under a franchise's listings and push the pagination off the page. They sit in `app/` rather than a domain because they are shell furniture like `AppFooter`; mounting them from `App` is also what keeps the dependency direction right, since a `teams` component importing from `app/` would invert it. The order is the argument: reassure (`TheGDWaySection`), offer help without browsing (`ConciergeSection`), ask for the sell side (`SellCtaSection`), answer what is left (`FaqSection`).

**`shared/components/Reveal.tsx` is the only viewport-triggered animation in the app.** Everything else animates on mount, on a remount key, or on a timer. It exists as one component because the mechanism has a test-environment cost that should be paid once — and because a dozen hand-written `whileInView` props are a dozen chances to forget `once: true`, without which the page dismantles and rebuilds itself every time a visitor scrolls back up. `amount: 0.2`, not the more usual 0.3: the threshold is a fraction of *the element*, and the concierge card is taller than a short laptop viewport, so a high threshold means a tall element can never trip and stays invisible forever.

**jsdom has no `IntersectionObserver`, so `src/test/setup.ts` stubs one that reports intersection immediately.** A no-op stub is worse than none: every revealed element holds `opacity: 0`, all content assertions still pass, and the sections are blank for a reason nothing names. `TheGDWaySection.test.tsx`'s reveal test is the only thing that notices, for every landing section at once — verified by neutering the stub and watching the other tests stay green. Reduced motion does **not** cover this: `reducedMotion="user"` drops the transform (confirmed — the element settles at `transform: none`) but still fades opacity, and it has no opinion about what *triggers* an animation.

**The brand words in the heading are `ShinyText`** (`shared/components/ShinyText.tsx`), a third React Bits adaptation. It paints ordinary text with `background-clip: text` over a transparent fill and walks the background position on a frame loop, so **the gradient *is* the colour** — a `text-*` utility on that span does nothing, which is the first thing anyone tries. The glyphs stay real text, so unlike the hero's `StrokeText` it needs no `role="img"`/`aria-label` and the `<h2>` announces as one sentence; `TheGDWaySection.test.tsx` pins that, because a heading that quietly became a picture would look perfect and vanish from the outline.

**`--psl-accent-shine` is the one token whose light and dark values move in opposite directions.** A shine normally means "lighter", and in dark it is `#ffffff` (19.03). In light it cannot be: the base is `accent-ink` at 4.92, and every lighter step of that hue lands on the brand green's 1.33, so the heading would drop below readable each time the sweep crossed a glyph. Light mode therefore shines *darker*, to `#2e4a00` (9.13) — the same sheen, never dipping under the base. It has no `@theme inline` entry because nothing needs a utility for it; it is read through `var()` in an inline gradient.

**Reduced motion is hand-gated, and it is the likeliest thing to be lost in a re-sync.** `MotionConfig reducedMotion="user"` governs Motion's *animations*; `useAnimationFrame` is a raw frame loop it never sees, so the shine would sweep forever for someone who asked the system to stop. Parking `progress` at 0 puts the highlight off-screen, which renders the flat base colour rather than a frozen half-gradient. The call site runs it slow with a long hold (`speed={2.5} delay={3.5}`) — a glint every ~6s, where the stock 2s loop on a heading reads as a loading state.

**The three pillars are `SpotlightCard`s** (`shared/components/SpotlightCard.tsx`), adapted from React Bits like `StrokeText`. Upstream hard-codes `border-neutral-800 bg-neutral-900` and an `rgba(255,255,255,.25)` spotlight, which would be a permanently dark card with an invisible glow in light mode; here it is the same `border-border-hairline` + `bg-surface` as every other card, and the spotlight defaults to `color-mix(in oklab, var(--psl-accent) 22%, transparent)` — the hero's and the sell CTA's formula, so all three washes of green on the page are one treatment and all three follow the theme with no `dark:` variant. **The `spotlightColor` prop was widened from upstream's `rgba(…)` template-literal type to `string` for exactly that reason:** that type cannot express a `var()`. It is a named export, unlike `StrokeText` — `StrokeText` is default-exported only because it is kept byte-close to upstream for re-syncing, and this one is already adapted.

The glow needs no reduced-motion handling: its only animation is `transition-opacity`, and the `prefers-reduced-motion` block in `globals.css` clamps every `transition-duration` to 0.01ms. **Nothing may ever be encoded in the spotlight** — touch devices never fire `mousemove`, so a phone sees the card with no glow at all, and it has to read identically. `h-full` goes on both the `Reveal` wrapper and the card, since the grid stretches only the wrapper and the three bodies are different lengths.

`ConciergeSection` wears **`holo-ring`** deliberately: the iridescent border is this app's mark for a machine's read on a market, worn otherwise only by `AIInsightPanel` and the verdict chips, so a visitor who has been through the buy flow already knows what the section is before reading a word.

**Two phone numbers, and the split is the point.** The green button dials an AI that does not exist, so it is a `<button>` answering with `showOfferNotice` — never `<a href="tel:">`, which promises a call that cannot connect and on a phone really tries. The "prefer a human" line is the house number and *is* a genuine anchor, because `tel:` works without a backend. One number behind both would make the same digits a link in one place and a button three lines below. `shared/config/contact.ts` owns all of it — the footer, the concierge and the sell CTA quote the same values, and a marketplace listing two different numbers for itself reads as a scam.

`SymmetricWave` is the equaliser: nine bars on a **symmetric delay map** (`[0,1,2,3,4,3,2,1,0]` × 0.1s), so the ends start together and the pulse travels inward to meet in the centre. Read it as a shape, not nine numbers — a monotonic ramp would march one way like a loading bar, and the breathing motion is what reads as a voice. The duplicate values are why the map is keyed by index.

**It animates `height`, not `scaleY`, and that is deliberate.** A transform would be composited and cheaper, but the bars are `rounded-full`, and scaling a pill vertically stretches its end caps into ellipses — the bars would visibly deform as they moved. A border radius resolves in absolute units, so animating height keeps the caps circular. Nine small boxes relaying out on a landing card is worth that; it would not be inside a long list.

**That choice makes the hand-rolled reduced-motion branch more necessary, not less.** `MotionConfig reducedMotion="user"` governs transform and layout animations only — it has **no opinion about `height`**, so left to the global config this would bounce forever at precisely the person who asked the OS to stop things moving. (The earlier `scaleY` version failed differently: the config honoured it by jumping to the end of the keyframes, leaving permanently squashed stubs.) The still branch reuses the delay map as a height map, so the paused frame is the wave at its widest rather than a flat row of dots. `SymmetricWave.test.tsx` pins the mirror symmetry, since a one-way ramp would break the moving and still versions at once.

**`SellCtaSection` follows the theme, and must not be pinned dark again.** It shipped with the `dark` class on the argument that light mode is a long pale run and the page's one call to action should not be the flattest thing on it. In light mode that bought a near-black slab dropped into a near-white document, which read as a rendering fault rather than as emphasis. **The two surfaces that legitimately pin dark have reasons this one never had** — `AppHeader`'s bright-green mark would be swallowed by a light bar, and `TeamsHero`'s type sits on dark footage — so there are still exactly two, not three. `SellCtaSection.test.tsx` pins the *absence* of the class, because re-adding it is a one-word change that looks harmless and breaks light mode outright.

Emphasis comes instead from the accent radial and the button's halo, both `--psl-accent` mixed into `transparent` so they land as a green haze on `#fbfbfa` and a glow on `#040811` with no second declaration. **It carries no border, also a correction:** `border-y` read as a seam ruled across the page rather than the edge of a slab, which is what `TeamsHero` already learned. Check both modes before adding one back.

**The offer is open content on the band, never a card** — it briefly sat on an accent-tinted panel and that was reverted. The panel looked right in isolation and was wrong for the page: every other band here is open content on a ground, so a framed box read as a widget dropped into the layout rather than part of it. The rule it leaves behind is worth keeping: **cards in this app hold *things* — a listing, a pillar, a concierge — never a whole section's message.** What marks the band as the climax instead is the pinned dark ground, the radial, the blurred accent pool under the button, `size="lg"`, and a generous `py-20 sm:py-28`, since on an open band space is the frame. **No copy was added** — the reference's four lines are intact.

**`Button` takes `size`, and padding must never be passed through `className`.** The component sets `px`/`py`/`text`, so a size handed in alongside is a second declaration of the same property, and two of those resolve by **CSS source order, not class-attribute order** — it appears to work until Tailwind reorders its output. `IconButton` already took `size` for this reason; `Button` now does too, with `lg` reserved for this one CTA.

**The FAQ's answers are never unmounted — they are clipped to zero height and carry `inert`.** Deliberately not `AnimatePresence`, whose exit callback does not fire in jsdom (the hazard already documented on `AIInsightPanel`). `inert` is what makes the always-mounted panel safe: the text is still laid out inside a zero-height box, so without it a keyboard user tabs into invisible paragraphs and a screen reader recites all eight answers. One row is open at a time because eight expanded answers run past three screens and bury the footer.

**Emails inside answers become `mailto:` anchors at render time, via `linkifyEmails`.** That indirection is what lets `answer` stay a plain string: the same array feeds the accordion and the structured data, and schema.org wants text for `acceptedAnswer`, so turning answers into `ReactNode`s would either publish markup to a search engine or force a second, drifting copy of every answer. It survived translation unchanged and is the reason the two answers that quote an inbox use a `{{sellEmail}}` / `{{ticketsEmail}}` value rather than putting the address in the copy — a translator cannot then alter an inbox that has to match `shared/config/contact.ts`. Two details are pinned by tests — the address pattern ends `(?:\.[\w-]+)+` so a sentence-final "…tickets@gdseats.com." does **not** swallow the full stop into a `mailto:` that bounces, and the split uses index parity rather than `RegExp.test`, which on a `g` regex advances `lastIndex` and would match every other call.

**The `FAQPage` JSON-LD is derived from the same array that renders the accordion, which departs from how the other SEO strings are handled.** `site.ts` and `index.html` state the title and description twice because a scraper reads static markup and static HTML cannot import TypeScript — a trade worth making for three short strings, and not for eight paragraph-length answers, where the duplicate would be the largest block of copy in the repo and the failure mode is publishing structured data that misquotes the page. The cost is that the payload only exists after React renders; Google executes JS, and a crawler that does not still gets the same content as visible text. `FaqSection.test.tsx` asserts the structured questions equal the rendered button labels, which is what makes "one array" true rather than aspirational. Once the answers came from `t()` the payload became locale-dependent automatically — which is correct, and is the whole reason derivation beat duplication; it carries `inLanguage`, and the test now runs under `es` as well, because English structured data over a Spanish page is structured data that misquotes the page.

## Toasts

`react-toastify`, hosted by `ToastContainer` in `AppProviders` (not `App`) so tests can assert on toasts without mounting the shell. `theme` reads `useIsDarkTheme`, never `useTheme`. The library's palette is remapped onto our tokens in `globals.css`, so a toast is correct in both modes with no `dark:` rule; the info accent is `--psl-accent-mark`, not the raw brand green, which is 1.33:1 on the toast surface.

`shared/utils/demoNotice.tsx` is the single wording for every control that exists as chrome but leads nowhere, with a fixed `toastId` so repeats collapse into one. It carries two notices: `showDemoNotice` for furniture (footer policy links, Share), and `showOfferNotice` for the offer button — **the one dead control a visitor reaches on purpose**, at the end of the whole flow, so it answers with an invitation and a LinkedIn link rather than an apology. That toast sets `closeOnClick: false` and a long `autoClose`, or the container would dismiss it out from under the pointer before the link resolved. The file is `.tsx` for that link; that is the component layer, not the React-free rule domain services live under — which is also why it may reach `i18n.t()` and `<Trans>` directly, one of only two files that may.

Renaming a module's extension leaves Vite's dev server holding the old resolution — it will 404 on the vanished path and blank the page until restarted. The build is unaffected. **Dead chrome is a `<button>`, never `<a href="#">`** — a link that doesn't navigate lies to a screen reader about what Enter does. `AppFooter`'s Company column is buttons; its `tel:` / `mailto:` details are genuine anchors, being the only two things on the page that work without a backend. `AppFooter.test.tsx` pins that split.

**The three controls above the grid regroup at `sm`, and the mechanism is `contents`.** Mobile stacks them as *league (full width) → search + pagination (one row)*; desktop is *league + search on the left, pagination pushed right*. `TeamsScreen` wraps search and pagination in a div that becomes `display: contents` at the breakpoint, so both drop into the row above as direct flex items — regrouping across a breakpoint without rendering either control twice. The mobile row uses `items-stretch` because the pagination box is 46px and the field 42; left alone they sit on different baselines. `TeamsPagination` carries `h-full` and `whitespace-nowrap` for the same reason — a narrow row otherwise breaks "1 of 3" over three lines.

**`LeagueSwitch`'s selected fill is one element that travels, not two that toggle.** It renders only under the active option and carries `layoutId="league-selected"`, so Motion slides it between the halves. That slide is the only confirmation the change came from the user — the grid re-renders too fast to read as a response. A background under both options switching opacity looks identical in a screenshot and silently deletes the animation, so `TeamsScreen.test.tsx` pins that exactly one fill exists and that it lives inside the pressed button. The buttons carry **no `whileHover`/`whileTap` transform**: a transform on the parent moves the box Motion measures the shared layout against, and the pill lands in the wrong place — hover is a background change instead.

`TeamSearchCombobox` sits beside `LeagueSwitch`, not in the hero — the reference put its search in the band, but a control there competes with the headline for the one thing that screen has to say. It jumps straight to a franchise's listings via the same `onSelectTeam` the cards use, and deliberately **does not filter the grid**. Hand-rolled rather than added as a dependency (the only Radix package here is the tooltip). Options suppress `mousedown`'s default so the blur-close can't unmount the row mid-click — the classic hand-built-combobox bug, pinned by a test. Venue is searchable alongside the name because a seat licence is bought for a building as much as for a team.

**The grid pages on a swipe, via `shared/hooks/useSwipe.ts`.** The same props are spread on the card grid and on the dot indicator below it — the cards are where a thumb lands, the dots are what looks like it should respond to a drag. Three things in that hook are load-bearing and all are pinned by `TeamsScreen.test.tsx`:

- **Mouse pointers are ignored outright.** A mouse drag across a grid is a text selection, not a page turn.
- **The gesture must be clearly sideways** (`|dx|` over 48px *and* over 1.5× `|dy|`). Scrolling is what a finger does here nearly every time and a scroll is rarely straight; without the ratio a slanted scroll pages the catalogue out from under the reader.
- **The trailing `click` is swallowed in the capture phase.** The pointer sequence still ends in a click on whatever card the finger came down on, so without this every swipe also opens a franchise. The flag disarms on use *and* on the next `pointerdown`, so a swipe that never produced a click can't eat an unrelated tap later.

Nothing calls `preventDefault` on the pointer stream, so vertical scrolling is untouched — the browser keeps it and hands back a `pointercancel`. The dots stay plain `<button>`s rather than becoming a `role="slider"`: the gesture is an enhancement over controls that already work with a keyboard and a screen reader, and it has no accessible equivalent of its own.

## Charts

`PriceStatsChart` is inline SVG, no chart dependency (Recharts was removed). It is an **emphasis** chart: the listing in question takes the accent, every peer recedes to the muted token, because the question is "where does mine land". The price history table above it is the table-view twin, so no value is chart-only.

## Team logos (ESPN)

Real franchise marks come from ESPN. `teams/data/teamLogos.ts` is **generated** — refresh with `pnpm logos:sync`, never hand-edit. The sync script is the only thing in the repo that knows the API exists; the app ships a static import and makes **zero runtime requests to ESPN's API**, which keeps the first screen as deterministic as the rest of the seeded demo. (The browser does fetch the *images* from `a.espncdn.com` at runtime — that is the combiner URL below, not the API.)

**Two ESPN hosts, and they belong in different places.** `site.api.espn.com/...` is the team-list endpoint, read only by `scripts/syncTeamLogos.mjs` at author time; it is overridable via `ESPN_TEAMS_ENDPOINT` with a default, and deliberately **not** a `VITE_` var — nothing in the bundle reads it, and there is no secret (the endpoint is public and unauthenticated). `a.espncdn.com/combiner/i` is a runtime image host and stays a constant in `teamLogo.service.ts`: the host is inseparable from the `?img=&w=&h=` contract `getTeamLogoUrl` builds, so making the host alone configurable would be a setting that breaks the feature whenever it is used.

Three things that look like details and are not:

- **Never link the raw asset.** ESPN's stored files are wildly inconsistent — the Raiders' dark mark is 491 KB at 4096², a grid of 24 would be ~12 MB. `getTeamLogoUrl` routes everything through `a.espncdn.com/combiner/i?…&w=&h=` at 2× the rendered size, which brings that same mark to ~5 KB. The map therefore stores **paths**, not URLs; a test pins that.
- **`rel` is an unordered set**, not a positional array. Match with `includes`, never by index, and never assume `logos[0]` is the default.
- **`["full","dark"]` means "for dark backgrounds"** — it carries a light keyline so black marks (Raiders, Jets) survive `#040811`. Verified visually, not inferred from the name.

Our team ids *are* ESPN's abbreviations (`dal`, `sf`, `lv`, `jax`…), so the join needs no mapping table — the sync confirmed every published href matches the derived path exactly.

`TeamLogo` has two independent fallbacks to `TeamCrest`, because they fail for different reasons: no entry in the map (catalogue grew without a re-sync) and `onError` (CDN up but not serving). `teamLogo.service.test.ts` guards the first by asserting every team in `TEAMS` has a mark.

**`useIsDarkTheme` vs `useTheme`.** `useTheme` *sets* the theme — each instance writes localStorage and toggles the root class, so it is safe with exactly one consumer (`ThemeToggle`). Anything that only needs to *read* the theme uses `shared/hooks/useIsDarkTheme.ts`, which is `useSyncExternalStore` over a single MutationObserver. Don't call `useTheme` from list items.

**`useMediaQuery` is a last resort, not a tool.** `shared/hooks/useMediaQuery.ts` exists for the one case where the viewport has to change *what renders* rather than how it looks — see the listing overlay section. Anything presentational belongs in a `sm:`/`lg:` variant, which costs no JavaScript and can't disagree with the CSS. It's built on `useSyncExternalStore` for the same reason `useIsDarkTheme` is: no effect, so the first render already has the right answer and no frame shows the wrong branch.

**`AppHeader` is the one full-bleed band in the shell.** Every other — hero, landing sections, footer — settles into a centred `mx-auto max-w-7xl`; the bar spans the viewport so the brand sits against the left edge and the controls against the right. It held the shared container for a while and on a wide window that read as a gap rather than a bar: at 1920px an 80rem column leaves ~320px dead at each end, floating the logo a third of the way in and giving `justify-between` nothing to push against. A navigation bar is the frame of the page, so it belongs to the window, not the text column. **The known cost:** the wordmark no longer aligns vertically with the hero headline or the footer's first column — normal for a full-bleed bar over centred content, and what the reference does. **Padding is deliberately unchanged (`px-7 sm:px-8`)**, which is what makes this invisible on phones: below 80rem the container never bit, so mobile was already full-bleed. An earlier full-bleed attempt failed only because it also dropped to `px-4 sm:px-6` and read as cramped — that was the padding's fault, not the width's. `AppHeader.test.tsx` pins the absence of `max-w-7xl`, since re-adding it is the obvious "consistency" edit and nothing on a phone would reveal it.

**Header control heights are owned by the row, not by the controls.** `AppHeader`'s right-hand group is `flex h-9 items-stretch sm:h-10`, and none of `LanguageSwitch`, `ThemeToggle` or `DemoMarker` declares a height — hence `IconButton`'s `size="none"`. The group is `[ LanguageSwitch ] [ ThemeToggle ] [ DemoMarker ]`: the two settings controls together, with the accent pill last as the visual terminus of the bar. They previously took theirs from two independent sources (a fixed `h-10` and the marker's own padding) and disagreed by 8px on mobile. Matching the values keeps them equal until the next restyle; having one owner is what makes them unable to disagree. Passing `h-9` through `className` while the component still emits `h-10` is not a fix: two declarations of one property resolve by CSS source order, not by class-attribute order.

**Width has an owner too, and it is the opposite one.** `DemoMarker` must never wrap — its pill is sized by the row, so a second line of text mangles the bar — hence `whitespace-nowrap` on the marker and `shrink-0` on the control group. That makes the brand wordmark the only flexible item left, which is why it carries `truncate` and its button carries `min-w-0`: a flex item's default `min-width: auto` will not shrink below its content, so without it the ellipsis never engages and the overflow lands on the page as a horizontal scrollbar instead. The four classes are one mechanism; `AppHeader.test.tsx` pins them together.

## The listing overlay on mobile

Below `sm` the panel is **full-bleed** — no margin, no radius, `min-h-dvh` (not `h-dvh`, the content is taller than the viewport and still has to scroll in the `fixed inset-0 overflow-y-auto` wrapper). The inset card returns at `sm:`. The header is `sticky top-0`, because the panel is four screens tall on a phone and the way out shouldn't require scrolling back to find it.

**Back and Share keep `aria-label` at every width; only the visible text is `hidden sm:inline`.** Three full-text controls in one row is what crushed this header at 390px, but an icon-only button with no accessible name is unusable — so the label is permanent and the text is the enhancement. `getByRole('button', { name: /back to search/i })` therefore passes at both sizes.

**There is exactly one JS breakpoint in the app, and it is here.** `ASIDE_QUERY = '(min-width: 1024px)'` via `shared/hooks/useMediaQuery.ts`, matching the `lg:` grid — **the two must move together.** It exists because `MakeAnOfferCard` owns `id="offer-amount"`, so an `lg:hidden` pair would put duplicate ids and two identically-labelled forms in one document, with the hidden copy still in the tab order. `inert` fixes the tab order but is an attribute, not a property, so it can't be breakpoint-scoped without JS either. Exactly one instance must exist, which forces a render-time branch. Everything purely presentational stays in Tailwind variants. (Still one: `LanguageSwitch` added none — it changes what a control *says*, never what renders.)

**Two positioning rules that look arbitrary and are not.** The panel is a `motion.div` animating `y`, and a transformed ancestor becomes the containing block for `position: fixed` descendants:

- The sticky CTA is `sticky bottom-0`, **never `fixed`** — a fixed bar would anchor to the panel and scroll away with it.
- `OfferSheet` is rendered **outside the panel**, as a sibling under the untransformed `fixed inset-0 z-50` root. It is also not rendered at all once the aside exists, rather than merely closed: a window dragged wider mid-offer would otherwise hold an open sheet and a new inline form, both owning `id="offer-amount"`.

**Escape is handled in one place, innermost first.** `ListingDetailOverlay`'s handler closes the sheet if it is open and the overlay otherwise. Both are dialogs listening for the same key; without the precedence, dismissing the sheet also throws the buyer back to the results and loses their place in ~170 rows.

`OfferSheet` gives **four ways out** — handle drag, backdrop, close button, Escape. The grab handle is the affordance a thumb reaches for, but drag has no keyboard equivalent and no accessible name, so it is `aria-hidden` and never the only exit.

`MakeAnOfferCard` takes `showHeading` (off in the sheet, which supplies its own titled header — two "Make an offer" headings in one dialog is a duplicate landmark) and `onAfterSubmit` (lets the sheet close so the invitation toast isn't behind it).

**Form inputs are `text-base sm:text-sm`.** iOS Safari zooms the whole viewport when a field under 16px takes focus and does not zoom back out. Invisible on every desktop browser.

## Icons and tooltips

Icons come from **lucide-react**; there are no emoji in the UI. Services must stay free of React, so **they emit a semantic icon *name*** (`TagIconName`, `TrendDirection`) and the component layer resolves it — `listing/components/tagPresentation.ts`, `teams/components/trendPresentation.ts`, `deal-analyzer/components/statusPresentation.ts`. Never import a component into a service to shortcut this.

**The same rule now covers copy: services emit a translation *key*, and the component layer resolves that too.** `ListingTag.labelKey`, `MarketTrend.labelKey` / `buyerImplicationKey`, `Insight.key` + `params`, `SORT_OPTIONS[].labelKey`, `STATUS_PRESENTATION[].labelKey`, `RECOMMENDATION_KEY`. It is the identical argument: a service that called `t()` would depend on i18n init order, its unit tests would assert English prose instead of logic, and the "why it matters commercially" comments would stop describing behaviour. See the Internationalisation section for the two files legitimately exempt.

Tooltips wrap **@radix-ui/react-tooltip** in `shared/components/Tooltip.tsx`. Hover tooltips never fire on touch, so **nothing may live only in a tooltip**: chips carry their own visible label, and the Total-cost breakdown repeats figures that `MakeAnOfferCard` shows as visible rows.

**`openOnTap` opens the tooltip on tap where `(hover: none)` matches** — on `TrendChip` and `Tag`, whose triggers are decorative chips. It is **opt-in and must stay that way**: it swallows the tap, so a trigger that also *does* something loses its action. `AppHeader`'s logo is wrapped in a tooltip and is the button that navigates home. The rule above has not moved either — tap is an enhancement, not a licence to put a value only in a tooltip.

Two things in that implementation look like over-engineering and are not:

- **On touch the open state is fully controlled and Radix gets no `onOpenChange`.** Radix closes a tooltip on the trigger's `pointerdown`, which lands *before* the `click` that would toggle it — share the state and the second tap reads as close-then-open, so the tooltip can never be dismissed by tapping what opened it.
- **Dismissal is a hand-rolled document listener**, and it ignores pointerdowns inside the trigger. Left to Radix, that outside-tap close and the click-toggle cancel each other out.

`TrendChip` and `Tag` sit inside `TeamCard`'s and `ListingRow`'s `<button>`, so the handler calls `stopPropagation` — without it, reading the forecast also opens the team, and the buyer is on another screen before the sentence renders. `TrendChip.test.tsx` pins that.

`Tag` takes `focusable` (default off). Chips inside `ListingRow` must stay non-focusable — the row is itself a `<button>`, and a focusable element nested in a button is invalid and would add hundreds of tab stops. `ListingSummaryCard` opts in, so the copy is keyboard-reachable somewhere.

Component tests must render via `@/test/utils`, not bare RTL — Radix Tooltip throws without its provider.

## Holographic treatment

Three classes in `styles/globals.css`, all **purely decorative**. They encode nothing and are exempt from the measured palette — don't try to validate their hues.

| Class | Where | Note |
|---|---|---|
| `.holo-ring` | `AIInsightPanel` | Rotating conic gradient masked to the border, plus a corner bloom. |
| `.holo-chip` | `DealBadge`, `TrendChip` | Same ring, faster and dimmer, no bloom. Both chips are a machine's read on a market, which is what the iridescence marks. |
| `.holo-icon` | the `BrainCircuit` mark | `stroke: url(#psl-holo-stroke) currentColor` |

All three are masked or stroked so **the content surface stays solid** — every contrast ratio measured for the text still holds.

Two things that look odd but are load-bearing:

- **`.holo-icon`'s trailing `currentColor` is the SVG paint fallback.** If the gradient `<defs>` (rendered inside `AIInsightPanel`) ever fails to resolve, the icon falls back to the inherited colour instead of vanishing. Don't drop it.
- **`ListingRow` sets `content-visibility: auto`.** Roughly 170 rows each carry a `.holo-chip`; without it every one animates off-screen and scrolling stutters. If the effect is ever made heavier, re-check this first.

On `DealBadge` the iridescence is on the **border only** — the fill keeps the verdict tint and the text the verdict ink, so the rainbow never washes out the hue that carries the meaning.

## Internationalisation

Four locales — **en · es · pt-BR · ja** — on `i18next` + `react-i18next`, with `LanguageSwitch` in the header. Nothing else was installed: no language detector (~4 KB to read `localStorage` and `navigator.language`, which the theme already hand-rolls), no HTTP backend (there is none), no ICU plugin (the copy needs interpolation and cardinal plurals, both in the core).

**Why i18next and not FormatJS or Lingui:** both want a Babel/SWC extraction step, and this repo builds with `tsc -b` plus Vite and no custom transform. i18next's core is also a plain JS singleton with no React dependency, which is what makes the two exemptions below possible at all.

**Two different identifiers, and conflating them is the quietest bug available here.** `shared/i18n/locales.ts` is the only place either appears: `code` resolves bundles, fills `<html lang>` and is stored under `psl-lang`; `intlLocale` constructs `Intl` formatters. `es` is unqualified as a UI code but formats as **`es-MX`** — `es-ES` would print `1.234,56` and every price on the page would change meaning without changing a digit. **Currency is USD in every locale**; only the formatting moves, and there is no converter and no currency picker.

The **endonyms are never translated**. Someone who landed on Japanese by accident has to be able to find "English" in the list.

### Layout and naming

```
src/shared/i18n/
  index.ts       # the singleton; getLocale(), getIntlLocale()
  locales.ts     # LOCALES, Locale, DEFAULT_LOCALE, LOCALE_STORAGE_KEY
  detect.ts      # readStoredLocale / resolveInitialLocale / persistLocale
  resources.ts   # NAMESPACES + the 4 × 11 imports
  locales/{en,es,pt-BR,ja}/*.json   # 11 namespaces each
  locales/TRANSLATORS.md            # the tone and length rules, in prose
```

**Centralised, not co-located per domain**, even though the codebase is feature-first: a translator gets one folder rather than a walk through `src/domains/*/i18n/`, and JSON creates no import edges so the dependency DAG is unaffected either way. The *namespace names* carry the domain structure instead. Keys are `namespace:section.key`, lowerCamelCase leaves — **never the English string as the key**, which would couple the key space to one language and make a copy edit look like a schema change.

**All four locales are bundled eagerly**, no `import()`. That costs ~15 KB gz of locale data inside a ~35 KB gz total for the feature (the libraries are the larger half), against a 6.2 MB hero video and 57 KB gz of GSAP for one headline. Lazy-loading would buy nothing measurable and cost a flash of English before the bundle resolves, a Suspense boundary above the shell, and async setup in every test file. Revisit past ~6 locales.

### The read/write split — mirrors `useTheme` / `useIsDarkTheme`

- **`useLanguage()`** *sets* the language. **Exactly one consumer: `LanguageSwitch`.**
- **Everything else reads through `useTranslation()`**, whose re-render is driven by i18next's own emitter. Don't call `useLanguage` from a list item.
- Anything needing the **Intl** locale reads `getIntlLocale()` off the singleton, not a hook — that is what lets `formatters.ts` stay callable from a service.

**Persistence hangs off the `languageChanged` event, not off the switcher**, so `i18n.changeLanguage('ja')` typed into a console persists and relabels `<html lang>` exactly like a click does. The pre-paint script in `index.html` applies `lang` before React mounts, for the same reason the theme script exists; its locale array is duplicated there because static markup cannot import TypeScript, and `site.config.test.ts` asserts the two agree.

### Two files may call `i18n.t()` directly, and only two

`shared/utils/demoNotice.tsx` (a toast fired from an event handler, with no component to hold a hook) and `app/documentMeta.ts` (the composition root; `useDocumentMeta` deliberately still takes plain strings and knows nothing about seats). Both are UI, not domain services, so the keys-not-sentences rule does not apply — but `App` subscribes via `useTranslation('meta')` purely so a language change re-renders and the tab title follows. That subscription looks unused and is load-bearing.

### What is deliberately not translated

- The brand name and its expansion, all 24 team and venue names, the postal address, the emails and phone numbers in `shared/config/contact.ts`, and listing IDs.

**The hero wordmark IS translated** (`hero:wordmark.lead` / `.tail`), which was a deliberate reversal — it was excluded in the original plan and the exclusion was overruled. Three mechanical things had to be solved rather than worked around, and each is now guarded:

| Was | Now |
|---|---|
| A Latin-only font stack, because stroked outlines are font-sensitive | CJK faces appended; fallback is per glyph so Latin is untouched |
| `.hero-wordmark` retinting a hard-coded first ten glyphs | `useWordmarkTint`, a layout effect keyed on `lead.length` |
| `HEADLINE_SETTLES` hand-computed from a 20-glyph string | `headlineSettles(...lines)`, derived per layout |

Two more things the plan never anticipated, both found in the browser rather than in tests: **the stacked lines have to be sized from a measurement** (or a translated phrase draws them at visibly different sizes), and **the wide layout has to stay one component** (or the two halves animate in parallel and the headline reads as two texts). The second is why the tint is imperative rather than two components with two colour props — the obvious, tidier-looking fix is the one that breaks the draw. See the Hero section.

**Switching language replays the draw.** `StrokeText` animates on *mount*, so a re-render alone would swap the glyphs in with no draw — and worse, it caches its `getBBox()` viewBox, so new copy would be drawn into the old language's box and clipped. `TeamsHero` keys a Fragment on `i18n.language`; the remount is the whole mechanism. `localeSwitch.test.tsx` pins it by node identity, since jsdom runs the animation as a no-op.
- **`site.ts`, `index.html` and `public/site.webmanifest` stay English.** They are what a social scraper fetches without running the bundle, and there is exactly one URL, so there is one canonical language for it. **Stated honestly: a LinkedIn or Slack preview of this app is always English, whatever the visitor's language.** Client-side i18n cannot change that without prerendering. `index.html` carries three `og:locale:alternate` tags and `useDocumentMeta` rewrites `og:locale` at runtime, which is as far as it goes.
- The FAQ's `FAQPage` JSON-LD *is* locale-dependent, because it is derived from the same array the accordion renders — that is the whole reason it was derived rather than duplicated, and `FaqSection.test.tsx` asserts the structured questions equal the rendered labels under both `en` and `es`.

### The guards

`src/shared/tests/i18n.locales.test.ts` is what makes the locale files trustworthy rather than merely present. Two rules it must keep:

- **Plural suffixes are normalised before key sets are compared.** Japanese has one cardinal category, so `_other` alone is its complete implementation of a key English spells across `_one` and `_other`. Without this the test is red for a *correct* translation on every plural in the app, and a test that is red for correct code gets deleted.
- **Interpolation placeholders are compared too**, as a union across each plural family. A translation that drops `{{count}}` renders a grammatical sentence with a hole where its number was — it reads as finished copy and quietly states nothing.

The analyzer's banned-words guard lives there too, scoped to **`en` only** and stated as such in the test: the list is English words, and inventing equivalents for three languages without a native reviewer would be theatre. `locales/TRANSLATORS.md` carries the rule in prose for the rest.

**The `es` and `pt-BR` translations are machine-authored first passes** and have not had a native review.

## Conventions

- `tsconfig.app.json` has `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` — no enums, no parameter properties, `import type` for types. `baseUrl` is intentionally absent (deprecated in TS 6).
- Tests are co-located in `domains/*/tests/`. **Comments are short and technical, or absent** — the `it()` name states what is validated, so a block restating it is noise. Keep a comment only for a hazard the code cannot show: a jsdom gap, a query-ordering trap, a timing rule.
- **Four test files are exempt and stay long-form**, because they are didactic rather than descriptive — they teach the technique with `STEP n` walkthroughs: `AIInsightPanel.test.tsx`, `marketTrend.service.test.ts`, `pricing.service.test.ts`, `MakeAnOfferCard.test.tsx`. Do not trim those; do not copy their style into new tests.
- **Comment budget, measured:** the codebase sits at ~0.20 comment lines per line of code outside those four files. Explain a constraint, a hazard or a decision that the code cannot state itself — not what the code already says.
- **The SEO strings are stated twice on purpose** — `src/shared/config/site.ts` and `index.html`, because a scraper fetches the markup and static HTML cannot import TypeScript. `src/shared/tests/site.config.test.ts` is the only thing keeping them in step: it reads the markup through Vite's `?raw` (not `node:fs`, since `tsconfig.app.json` omits the `node` types on purpose and adding them would hand `process.env` to every component) and asserts the title, the description, and every absolute URL agree. Moving to a custom domain touches **six** places; that test is what makes missing one loud instead of silent.
- `src/test/setup.ts` forces reduced motion so animations don't hide content from jsdom queries, and stubs `ResizeObserver`.
- **jsdom has no layout, so the suite picks a viewport: `min-width` queries answer `true`.** Desktop renders the most complete DOM. Flip one test with `setViewport('mobile')` from `@/test/utils`, **before `render`** — the stubbed `MediaQueryList` has a no-op `addEventListener`, so a component that already subscribed won't hear a mid-test change. `setup.ts` restores desktop after every test.
- **The suite runs in English, and that is what kept 33 existing test files passing through the extraction**: every assertion on copy is asserting on the `en` bundle, which is byte-identical to the literals it replaced. `setLocale(code)` from `@/test/utils` flips one test, with the same **call it before `render`** caveat as `setViewport`; `setup.ts` restores `en` after every test. `setup.ts` also imports the i18n singleton for its side effect, so service tests that never render still have a working `t`.
- **This environment has no `localStorage`.** Node 22 defines `globalThis.localStorage` as `undefined` without `--localstorage-file`, and that shadows the one jsdom would put on `window`. Every read in the app is already inside a `try/catch` (Safari private mode throws for the same shape of reason), so the app degrades correctly — but a test asserting on real storage is asserting on nothing. `LanguageSwitch.test.tsx` installs a minimal `Storage` for itself; don't move that into `setup.ts`, since everything else is correct to run without it.
- **`Button` and `IconButton` own their `px`/`py` via `size`** — never pass padding through `className` to fix a long translation. Two declarations of one property resolve by CSS source order, not class-attribute order.
- **`AnimatePresence` keeps an exiting node mounted until its exit finishes, even under reduced motion.** Assert its removal with `waitFor`, not synchronously — otherwise a passing component reads as a failing one.
