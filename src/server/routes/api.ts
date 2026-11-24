import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  ApiError,
  InitResponse,
  LeaderboardResponse,
  SubmitScoreResponse,
} from '../../shared/api';
import { seedFromDateKey, utcDateKey } from '../../shared/daily';
import {
  readDailyState,
  submitScore,
  type ScoreValidationError,
} from '../core/leaderboard';

export const api = new Hono();

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const INVALID_SCORE_MESSAGES: Record<ScoreValidationError, string> = {
  invalid_score: 'Score must be an integer between 0 and 9999.',
  invalid_duration: 'Run duration is missing or out of range.',
  implausible_score: 'Score is not plausible for the submitted run duration.',
};

const currentUsernameOrAnonymous = async (): Promise<string> => {
  const username = await reddit.getCurrentUsername();
  return username ?? 'anonymous';
};

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ApiError>(
      {
        status: 'error',
        code: 'bad_request',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const username = await currentUsernameOrAnonymous();
    const dateKey = utcDateKey();
    const state = await readDailyState(redis, dateKey, username);

    return c.json<InitResponse>({
      type: 'init',
      postId,
      username,
      daily: {
        dateKey,
        seed: seedFromDateKey(dateKey),
      },
      personalBest: state.personalBest,
      rank: state.rank,
      leaderboard: state.leaderboard,
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    return c.json<ApiError>(
      {
        status: 'error',
        code: 'server_error',
        message: 'Failed to load today\'s leaderboard.',
      },
      500
    );
  }
});

api.get('/leaderboard', async (c) => {
  try {
    const username = await currentUsernameOrAnonymous();
    const dateKey = utcDateKey();
    const state = await readDailyState(redis, dateKey, username);

    return c.json<LeaderboardResponse>({
      type: 'leaderboard',
      dateKey,
      personalBest: state.personalBest,
      rank: state.rank,
      leaderboard: state.leaderboard,
    });
  } catch (error) {
    console.error('API Leaderboard Error:', error);
    return c.json<ApiError>(
      {
        status: 'error',
        code: 'server_error',
        message: 'Failed to load today\'s leaderboard.',
      },
      500
    );
  }
});

api.post('/score', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<ApiError>(
        {
          status: 'error',
          code: 'unauthenticated',
          message: 'Log in to Reddit to save your score.',
        },
        401
      );
    }

    let payload: unknown;
    try {
      payload = await c.req.json<unknown>();
    } catch {
      return c.json<ApiError>(
        {
          status: 'error',
          code: 'bad_request',
          message: 'Request body must be valid JSON.',
        },
        400
      );
    }

    if (!isRecord(payload)) {
      return c.json<ApiError>(
        {
          status: 'error',
          code: 'bad_request',
          message: 'Request body must be a JSON object.',
        },
        400
      );
    }

    const dateKey = utcDateKey();
    const outcome = await submitScore(redis, {
      dateKey,
      username,
      score: payload.score,
      durationMs: payload.durationMs,
    });

    if (outcome.status === 'invalid') {
      return c.json<ApiError>(
        {
          status: 'error',
          code: 'bad_request',
          message: INVALID_SCORE_MESSAGES[outcome.reason],
        },
        400
      );
    }

    if (outcome.status === 'rate_limited') {
      return c.json<ApiError>(
        {
          status: 'error',
          code: 'rate_limited',
          message: 'Scores can be submitted once every two seconds.',
        },
        429
      );
    }

    return c.json<SubmitScoreResponse>({
      type: 'score',
      accepted: outcome.result.accepted,
      isNewBest: outcome.result.isNewBest,
      score: outcome.result.score,
      personalBest: outcome.result.personalBest,
      rank: outcome.result.rank,
      leaderboard: outcome.result.leaderboard,
    });
  } catch (error) {
    console.error('API Score Error:', error);
    return c.json<ApiError>(
      {
        status: 'error',
        code: 'server_error',
        message: 'Failed to save the score.',
      },
      500
    );
  }
});
