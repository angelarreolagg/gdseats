import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales'
import { NAMESPACES, resources } from '../i18n/resources'

/**
 * Validates: every locale carries the same keys, with the same placeholders, as
 * English.
 *
 * Why it matters commercially: both failure modes are silent in development and
 * loud to a paying visitor. A missing key renders the raw dotted path — a buyer
 * looking at a five-figure listing sees `analyzer:insights.trend.down` where the
 * verdict should be. A dropped `{{count}}` renders a grammatical sentence with a
 * hole where its number was, which is worse: it reads as finished copy and
 * quietly states nothing. Neither shows up unless someone reads the whole app in
 * a language they may not speak, which nobody does on every release.
 *
 * This is also what makes "the locale files are complete" a fact rather than an
 * aspiration, and therefore what makes it safe to add a locale by copying `en`
 * and translating it.
 */

type Bundle = Record<string, unknown>

/**
 * Plural suffixes are stripped before key sets are compared.
 *
 * Without this the test is not merely noisy, it is wrong: Japanese has one
 * cardinal category, so `listingCount_other` is its *complete* implementation of
 * a key English spells across `_one` and `_other`. Reporting that as a hole
 * would flag ja as broken on every plural in the app — and a test that is red
 * for a correct translation gets deleted, taking the real coverage with it.
 */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

/** `{{name}}`, `{{name, format}}` — the name is all that has to survive. */
const PLACEHOLDER = /\{\{\s*([\w.]+)/g

function flatten(value: unknown, prefix = '', into = new Map<string, string>()) {
  if (typeof value === 'string') {
    into.set(prefix, value)
    return into
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Bundle)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, into)
    }
  }
  return into
}

function placeholdersIn(value: string): string[] {
  // A fresh matchAll each call — `PLACEHOLDER` carries the `g` flag, and a
  // shared `lastIndex` is the same hazard `linkifyEmails` documents.
  return [...value.matchAll(PLACEHOLDER)].map((match) => match[1])
}

/**
 * Keys and placeholders, both collapsed across a plural family.
 *
 * The placeholder set is the UNION across `_one` / `_other` / … on purpose:
 * English's `_one` reads "over the next month" and legitimately drops
 * `{{count}}`, while its `_other` needs it. Comparing suffix-by-suffix would
 * either fail on that or force awkward English; comparing unions still catches
 * the thing that matters, which is a placeholder disappearing from a family
 * entirely.
 */
function summarise(bundle: unknown) {
  const keys = new Set<string>()
  const placeholders = new Map<string, Set<string>>()

  for (const [key, value] of flatten(bundle)) {
    const base = key.replace(PLURAL_SUFFIX, '')
    keys.add(base)

    const found = placeholders.get(base) ?? new Set<string>()
    for (const name of placeholdersIn(value)) found.add(name)
    placeholders.set(base, found)
  }

  return { keys, placeholders }
}

const OTHER_LOCALES = LOCALES.map((locale) => locale.code).filter(
  (code) => code !== DEFAULT_LOCALE,
)

describe('locale bundles', () => {
  it('ships every namespace for every locale', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(resources[locale.code]).sort()).toEqual([...NAMESPACES].sort())
    }
  })

  describe.each(OTHER_LOCALES)('%s', (locale) => {
    it.each(NAMESPACES)('has the same keys as en in %s.json', (namespace) => {
      const reference = summarise(resources[DEFAULT_LOCALE][namespace])
      const translated = summarise(resources[locale][namespace])

      const missing = [...reference.keys].filter((key) => !translated.keys.has(key))
      const extra = [...translated.keys].filter((key) => !reference.keys.has(key))

      expect({ missing, extra }).toEqual({ missing: [], extra: [] })
    })

    it.each(NAMESPACES)('keeps every interpolation placeholder in %s.json', (namespace) => {
      const reference = summarise(resources[DEFAULT_LOCALE][namespace])
      const translated = summarise(resources[locale][namespace])

      const dropped: string[] = []
      for (const [key, expected] of reference.placeholders) {
        const actual = translated.placeholders.get(key) ?? new Set<string>()
        for (const name of expected) {
          if (!actual.has(name)) dropped.push(`${key} → {{${name}}}`)
        }
      }

      expect(dropped).toEqual([])
    })
  })

  /**
   * Validates: `en` is the only bundle allowed to be checked for tone in English.
   * Why it matters: the analyzer's whole product argument is that it reads as
   * market context rather than as a warning — a five-figure purchase framed as a
   * hazard is a documented conversion regression. This guard used to live in
   * `insights.service.test.ts`; it moved with the words.
   *
   * Scoped to `en` deliberately, and that scoping is the honest part: the list is
   * English, and inventing equivalents for three other languages without a native
   * reviewer would be theatre that reads as coverage. `locales/TRANSLATORS.md`
   * carries the rule in prose for the rest, which is where a human can act on it.
   */
  it('keeps the English analyzer copy observational rather than directive', () => {
    const banned =
      /\b(too expensive|bad deal|overpriced|avoid|don't|do not|buy now|wait|should)\b/i

    // Values only. The KEYS are semantic and are allowed to say the quiet part:
    // `status.overpriced` is the internal name for the state whose visible label
    // is "Above market range", and that split is the whole design.
    for (const [key, value] of flatten(resources.en.analyzer)) {
      expect([key, value]).toEqual([key, expect.not.stringMatching(banned)])
    }
  })
})
