import type { RedisClient } from '@devvit/redis';
import type { LeaderboardEntry } from '../../shared/api';

/** The subset of Redis used by the leaderboard, kept structural for testing. */
export type LeaderboardStore = Pick<
  RedisClient,
  'zAdd' | 'zCard' | 'zRange' | 'zScore' | 'zRank' | 'set' | 'expire'
>;

export const TOP_SIZE = 10;
export const MAX_SCORE = 9999;
export const MAX_RUN_DURATION_MS = 15 * 60 * 1000;
export const MAX_SCORE_PER_SECOND = 2.5;
export const SCORE_GRACE_POINTS = 5;
export const RATE_LIMIT_MS = 2000;
export const LEADERBOARD_TTL_SECONDS = 8 * 24 * 60 * 60;

export const leaderboardKey = (dateKey: string): string => {
  return `leaderboard:${dateKey}`;
};

export const rateLimitKey = (dateKey: string, username: string): string => {
  return `ratelimit:score:${dateKey}:${username.toLowerCase()}`;
};

/**
 * Very loose upper bound for a plausible run. A perfect pipe + upvote run
 * scores roughly 3 points per 1.87s, so 2.5 points/s leaves headroom for
 * lucky upvote clusters while still rejecting obviously forged scores.
 */
export const scoreLimitForDuration = (durationMs: number): number => {
  return (
    Math.floor((durationMs / 1000) * MAX_SCORE_PER_SECOND) +
    SCORE_GRACE_POINTS
  );
};

export type ScoreValidationError =
  | 'invalid_score'
  | 'invalid_duration'
  | 'implausible_score';

export type ScoreValidation =
  | { ok: true; score: number; durationMs: number }
  | { ok: false; reason: ScoreValidationError };

export const validateScore = (
  score: unknown,
  durationMs: unknown
): ScoreValidation => {
  if (
    typeof score !== 'number' ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_SCORE
  ) {
    return { ok: false, reason: 'invalid_score' };
  }
  if (
    typeof durationMs !== 'number' ||
    !Number.isFinite(durationMs) ||
    durationMs < 0 ||
    durationMs > MAX_RUN_DURATION_MS
  ) {
    return { ok: false, reason: 'invalid_duration' };
  }
  if (score > scoreLimitForDuration(durationMs)) {
    return { ok: false, reason: 'implausible_score' };
  }
  return { ok: true, score, durationMs };
};

/** Converts Redis' ascending 0-based rank into a 1-based descending place. */
export const rankFromIndex = (
  cardSize: number,
  ascendingRank: number | undefined
): number | null => {
  if (ascendingRank === undefined || cardSize <= 0) {
    return null;
  }
  return cardSize - ascendingRank;
};

export type LeaderboardState = {
  personalBest: number;
  rank: number | null;
  leaderboard: LeaderboardEntry[];
};

export const readDailyState = async (
  store: LeaderboardStore,
  dateKey: string,
  username: string
): Promise<LeaderboardState> => {
  const key = leaderboardKey(dateKey);
  const [rows, personalBest, cardSize, ascendingRank] = await Promise.all([
    store.zRange(key, 0, TOP_SIZE - 1, { by: 'rank', reverse: true }),
    store.zScore(key, username),
    store.zCard(key),
    store.zRank(key, username),
  ]);

  const leaderboard: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    username: row.member,
    score: row.score,
    isCurrentUser: row.member === username,
  }));

  return {
    personalBest: personalBest ?? 0,
    rank: rankFromIndex(cardSize, ascendingRank),
    leaderboard,
  };
};

export type SubmitScoreInput = {
  dateKey: string;
  username: string;
  score: unknown;
  durationMs: unknown;
};

export type SubmitScoreResult = {
  accepted: true;
  score: number;
  isNewBest: boolean;
  personalBest: number;
  rank: number | null;
  leaderboard: LeaderboardEntry[];
};

export type SubmitScoreOutcome =
  | { status: 'ok'; result: SubmitScoreResult }
  | { status: 'invalid'; reason: ScoreValidationError }
  | { status: 'rate_limited' };

export const submitScore = async (
  store: LeaderboardStore,
  input: SubmitScoreInput
): Promise<SubmitScoreOutcome> => {
  const validation = validateScore(input.score, input.durationMs);
  if (!validation.ok) {
    return { status: 'invalid', reason: validation.reason };
  }

  const reservation = await store.set(
    rateLimitKey(input.dateKey, input.username),
    '1',
    { nx: true, expiration: new Date(Date.now() + RATE_LIMIT_MS) }
  );
  if (!reservation) {
    return { status: 'rate_limited' };
  }

  const key = leaderboardKey(input.dateKey);
  const previousBest = (await store.zScore(key, input.username)) ?? 0;
  const isNewBest = validation.score > previousBest;

  if (isNewBest) {
    await store.zAdd(key, {
      member: input.username,
      score: validation.score,
    });
    await store.expire(key, LEADERBOARD_TTL_SECONDS);
  }

  const state = await readDailyState(store, input.dateKey, input.username);
  return {
    status: 'ok',
    result: {
      accepted: true,
      score: validation.score,
      isNewBest,
      personalBest: state.personalBest,
      rank: state.rank,
      leaderboard: state.leaderboard,
    },
  };
};
