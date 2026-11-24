/** A deterministic pseudo-random source returning values in `[0, 1)`. */
export type RandomSource = () => number;

/** FNV-1a 32-bit string hash. Stable across runtimes and platforms. */
export const hash32 = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Mulberry32 PRNG: tiny, fast and good enough for level generation. */
export const mulberry32 = (seed: number): RandomSource => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Independent random stream for a given obstacle index.
 * Generation therefore never depends on how many obstacles were spawned
 * before, which keeps the daily level identical for every player and
 * makes paused/resumed sessions reproducible.
 */
export const rngForIndex = (seed: number, index: number): RandomSource => {
  const indexSeed = Math.imul(index + 1, 0x9e3779b1);
  return mulberry32((seed ^ indexSeed) >>> 0);
};

export const randomRange = (
  rng: RandomSource,
  min: number,
  max: number
): number => {
  return min + (max - min) * rng();
};

export const randomInt = (
  rng: RandomSource,
  minInclusive: number,
  maxExclusive: number
): number => {
  return Math.floor(randomRange(rng, minInclusive, maxExclusive));
};
