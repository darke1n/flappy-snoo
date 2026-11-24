import { hash32 } from './game/rng';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SEED_NAMESPACE = 'flappy-snoo';

/**
 * Returns the UTC day key (`YYYY-MM-DD`) for the given instant.
 * Both the server and the client use this helper so that the daily
 * leaderboard bucket and the level seed always agree.
 */
export const utcDateKey = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 10);
};

export const isDateKey = (value: string): boolean => {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

/** Deterministic uint32 level seed for a UTC day key. */
export const seedFromDateKey = (dateKey: string): number => {
  return hash32(`${SEED_NAMESPACE}:${dateKey}`);
};
