import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales'
import { NAMESPACES, resources } from '../i18n/resources'

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
