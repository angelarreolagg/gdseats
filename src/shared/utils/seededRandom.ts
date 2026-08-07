/** FNV-1a. Turns an identity string into a stable 32-bit seed. */
export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * mulberry32 — small, fast, repeatable.
 *
 * Every piece of mock data in this app is generated from a seed rather than
 * `Math.random()`. Unseeded values would re-roll on each render, which would make
 * the seat map's per-section counts disagree with the list beside it.
 */
export function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded RNG plus the helpers the generators need. */
export function createRandom(key: string) {
  const next = mulberry32(hashSeed(key))
  return {
    next,
    /** Integer in [min, max]. */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    /** Float in [min, max). */
    float: (min: number, max: number) => min + next() * (max - min),
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
  }
}
