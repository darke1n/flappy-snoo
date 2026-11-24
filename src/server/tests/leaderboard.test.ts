import assert from 'node:assert/strict';
import test from 'node:test';
import {
  leaderboardKey,
  rankFromIndex,
  rateLimitKey,
  scoreLimitForDuration,
  submitScore,
  validateScore,
  type LeaderboardStore,
} from '../core/leaderboard';

type Row = { member: string; score: number };

/**
 * Minimal in-memory Redis stand-in: sorted sets, string keys and NX sets.
 * Enough to exercise the leaderboard logic without the Devvit runtime.
 */
class FakeStore implements LeaderboardStore {
  private readonly sets = new Map<string, Map<string, number>>();
  private readonly strings = new Map<string, string>();

  private sorted(key: string): Row[] {
    const set = this.sets.get(key);
    if (!set) {
      return [];
    }
    return [...set.entries()]
      .map(([member, score]) => ({ member, score }))
      .sort((a, b) => a.score - b.score || a.member.localeCompare(b.member));
  }

  clearRateLimits(): void {
    this.strings.clear();
  }

  async zAdd(key: string, ...members: Row[]): Promise<number> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Map<string, number>();
      this.sets.set(key, set);
    }
    let added = 0;
    for (const { member, score } of members) {
      if (!set.has(member)) {
        added += 1;
      }
      set.set(member, score);
    }
    return added;
  }

  async zCard(key: string): Promise<number> {
    return this.sets.get(key)?.size ?? 0;
  }

  async zScore(key: string, member: string): Promise<number | undefined> {
    return this.sets.get(key)?.get(member);
  }

  async zRank(key: string, member: string): Promise<number | undefined> {
    const index = this.sorted(key).findIndex((row) => row.member === member);
    return index === -1 ? undefined : index;
  }

  async zRange(
    key: string,
    start: number | string,
    stop: number | string,
    options?: { reverse?: boolean; by?: 'score' | 'lex' | 'rank' }
  ): Promise<Row[]> {
    const rows = this.sorted(key);
    const ordered = options?.reverse ? [...rows].reverse() : rows;
    return ordered.slice(Number(start), Number(stop) + 1);
  }

  async set(
    key: string,
    value: string,
    options?: { nx?: boolean; xx?: boolean; expiration?: Date }
  ): Promise<string> {
    if (options?.nx && this.strings.has(key)) {
      return '';
    }
    this.strings.set(key, value);
    return 'OK';
  }

  async expire(): Promise<void> {
    return;
  }
}

const DATE = '2026-11-21';

test('validateScore accepts plausible runs', () => {
  assert.deepEqual(validateScore(0, 0), {
    ok: true,
    score: 0,
    durationMs: 0,
  });
  assert.deepEqual(validateScore(10, 30_000), {
    ok: true,
    score: 10,
    durationMs: 30_000,
  });
});

test('validateScore rejects malformed and implausible values', () => {
  assert.deepEqual(validateScore(-1, 10_000), {
    ok: false,
    reason: 'invalid_score',
  });
  assert.deepEqual(validateScore(3.5, 10_000), {
    ok: false,
    reason: 'invalid_score',
  });
  assert.deepEqual(validateScore('12', 10_000), {
    ok: false,
    reason: 'invalid_score',
  });
  assert.deepEqual(validateScore(5, -1), {
    ok: false,
    reason: 'invalid_duration',
  });
  assert.deepEqual(validateScore(5, Number.NaN), {
    ok: false,
    reason: 'invalid_duration',
  });
  assert.deepEqual(validateScore(100, 1000), {
    ok: false,
    reason: 'implausible_score',
  });
});

test('scoreLimitForDuration grows linearly with a grace margin', () => {
  assert.equal(scoreLimitForDuration(0), 5);
  assert.equal(scoreLimitForDuration(10_000), 30);
  assert.ok(scoreLimitForDuration(20_000) > scoreLimitForDuration(10_000));
});

test('rankFromIndex converts ascending rank to a descending place', () => {
  assert.equal(rankFromIndex(10, 9), 1);
  assert.equal(rankFromIndex(10, 0), 10);
  assert.equal(rankFromIndex(1, 0), 1);
  assert.equal(rankFromIndex(10, undefined), null);
  assert.equal(rankFromIndex(0, 0), null);
});

test('redis keys are stable and rate limits are per-user case-insensitive', () => {
  assert.equal(leaderboardKey(DATE), 'leaderboard:2026-11-21');
  assert.equal(
    rateLimitKey(DATE, 'Alice'),
    rateLimitKey(DATE, 'alice')
  );
});

test('submitScore stores personal bests and returns updated standings', async () => {
  const store = new FakeStore();

  const first = await submitScore(store, {
    dateKey: DATE,
    username: 'alice',
    score: 5,
    durationMs: 30_000,
  });
  assert.equal(first.status, 'ok');
  if (first.status !== 'ok') {
    return;
  }
  assert.equal(first.result.isNewBest, true);
  assert.equal(first.result.personalBest, 5);
  assert.equal(first.result.rank, 1);
  assert.deepEqual(first.result.leaderboard, [
    { rank: 1, username: 'alice', score: 5, isCurrentUser: true },
  ]);

  store.clearRateLimits();
  const improved = await submitScore(store, {
    dateKey: DATE,
    username: 'alice',
    score: 9,
    durationMs: 45_000,
  });
  assert.equal(improved.status, 'ok');
  if (improved.status !== 'ok') {
    return;
  }
  assert.equal(improved.result.isNewBest, true);
  assert.equal(improved.result.personalBest, 9);

  store.clearRateLimits();
  const worse = await submitScore(store, {
    dateKey: DATE,
    username: 'alice',
    score: 7,
    durationMs: 60_000,
  });
  assert.equal(worse.status, 'ok');
  if (worse.status !== 'ok') {
    return;
  }
  assert.equal(worse.result.isNewBest, false);
  assert.equal(worse.result.personalBest, 9);
  assert.equal(worse.result.score, 7);

  store.clearRateLimits();
  const bob = await submitScore(store, {
    dateKey: DATE,
    username: 'bob',
    score: 12,
    durationMs: 60_000,
  });
  assert.equal(bob.status, 'ok');
  if (bob.status !== 'ok') {
    return;
  }
  assert.equal(bob.result.rank, 1);
  assert.equal(bob.result.leaderboard.length, 2);
  assert.equal(bob.result.leaderboard[0]?.username, 'bob');
  assert.equal(bob.result.leaderboard[1]?.username, 'alice');
  assert.equal(bob.result.leaderboard[1]?.isCurrentUser, false);
});

test('submitScore rate limits rapid submissions per user', async () => {
  const store = new FakeStore();

  const first = await submitScore(store, {
    dateKey: DATE,
    username: 'carol',
    score: 3,
    durationMs: 20_000,
  });
  assert.equal(first.status, 'ok');

  const second = await submitScore(store, {
    dateKey: DATE,
    username: 'carol',
    score: 4,
    durationMs: 20_000,
  });
  assert.equal(second.status, 'rate_limited');
});

test('submitScore rejects invalid payloads before touching Redis', async () => {
  const store = new FakeStore();

  const invalid = await submitScore(store, {
    dateKey: DATE,
    username: 'dave',
    score: 500,
    durationMs: 1000,
  });
  assert.deepEqual(invalid, { status: 'invalid', reason: 'implausible_score' });
  assert.equal(await store.zCard(leaderboardKey(DATE)), 0);
});
