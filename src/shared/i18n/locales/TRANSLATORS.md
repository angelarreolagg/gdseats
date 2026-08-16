# Notes for translators

Product constraints, not style preferences. Two test files enforce parts of this,
and a translation that reads fine in isolation can still fail review for reasons
that are invisible in the string itself.

Kept as prose beside the bundles rather than as `_comment` siblings inside the
JSON, because `i18n.locales.test.ts` compares key sets between locales — a note
key present in `en` and absent everywhere else would be reported as a hole in
every other language.

## Tone

**`analyzer.json` is market context, never a warning.** This panel sits beside a
five-figure purchase. Framed as pass/warn/fail it stops being useful and starts
being an obstacle: a buyer who reads "Overpriced" in red walks away from a
listing that may still be right for them. So:

- Status labels are observational. "Above market range", not "Overpriced". "In
  line with market", not "Fair price". "Attractive value", not "Bargain".
- `recommendation.*` is suggestive and never imperative. "You may find better
  value by waiting" — not "Wait". No "Buy now", no "Avoid", no "Don't".
- Insight bullets report rather than judge. "Price adjusted down 9%", not
  "dropped" or "collapsed". "Revisions", not "cuts".

**`teams.json > trend.*` follows the same rule**, and carries one inversion worth
knowing: the tone is measured from the *buyer's* side, so "Cooling off" is the
good news. A translation that rewords it as bad news for the franchise inverts
the meaning of the colour it is printed in.

## Sentences whose subject cannot move

`analyzer.json > insights.sectionAverage.above` / `.below` — **the listing has to
stay the subject.** "Sits 14% above the section 143 average" is measured against
the average; rephrasing it around the comparables ("comparables sit 14% lower")
attaches that figure to a different reference point and is wrong by the ratio
between the two.

## Nothing may live only in a tooltip

Hover never fires on a touchscreen. Every chip's visible label
(`listing.json > tags.*`, `teams.json > trend.label.*`) has to stand on its own;
the matching `tagTooltips.*` / `trend.implication.*` entry is supplementary and
can be longer, but it can never be where the meaning is.

## Length

Spanish and Portuguese run 20–30% longer than English. Three surfaces are tight
enough that a long translation breaks the layout rather than wrapping politely:

| Key | Constraint |
|---|---|
| `header.json > demoMarker` | One line inside a pill sized by the header row. Prefer a short form ("Demo") over a faithful long one. |
| `analyzer.json > metrics.*` | Three columns with `truncate`. Shorter is better than complete. |
| `teams.json > pagination.position` | Must stay on one line at 350px. |

Japanese is usually shorter but its glyphs are wider; `uppercase` is a no-op on
kana and kanji, which is expected — chips simply render at normal case.

## Placeholders

`{{name}}` tokens must all survive translation, and `{{count}}` in particular
drives plural selection. Dropping one renders a sentence with a hole in it where
a number should be. Word order is free; the tokens are not optional.

Japanese needs only the `_other` plural form. That is correct, not an omission.

## Never translated

The hero wordmark (`SOME SEATS MEAN MORE`, which is not in these files at all),
the brand name and its expansion, all 24 team and venue names, street addresses,
email addresses, phone numbers, and listing IDs.
