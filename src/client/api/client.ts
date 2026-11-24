import type {
  ApiError,
  ApiErrorCode,
  InitResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
} from '../../shared/api';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

const REQUEST_TIMEOUT_MS = 6000;
const ERROR_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  'bad_request',
  'unauthenticated',
  'rate_limited',
  'server_error',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const isInteger = (value: unknown): value is number => {
  return isNumber(value) && Number.isInteger(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

const isNullableNumber = (value: unknown): value is number | null => {
  return value === null || isNumber(value);
};

const isApiErrorCode = (value: unknown): value is ApiErrorCode => {
  return typeof value === 'string' && ERROR_CODES.has(value);
};

const isLeaderboardEntry = (value: unknown): value is LeaderboardEntry => {
  return (
    isRecord(value) &&
    isInteger(value.rank) &&
    isString(value.username) &&
    isNumber(value.score) &&
    isBoolean(value.isCurrentUser)
  );
};

const isLeaderboard = (value: unknown): value is LeaderboardEntry[] => {
  return Array.isArray(value) && value.every(isLeaderboardEntry);
};

const parseInitResponse = (value: unknown): InitResponse | null => {
  if (
    !isRecord(value) ||
    value.type !== 'init' ||
    !isString(value.postId) ||
    !isString(value.username) ||
    !isRecord(value.daily) ||
    !isString(value.daily.dateKey) ||
    !isInteger(value.daily.seed) ||
    !isNumber(value.personalBest) ||
    !isNullableNumber(value.rank) ||
    !isLeaderboard(value.leaderboard)
  ) {
    return null;
  }

  return {
    type: 'init',
    postId: value.postId,
    username: value.username,
    daily: {
      dateKey: value.daily.dateKey,
      seed: value.daily.seed,
    },
    personalBest: value.personalBest,
    rank: value.rank,
    leaderboard: value.leaderboard,
  };
};

const parseLeaderboardResponse = (value: unknown): LeaderboardResponse | null => {
  if (
    !isRecord(value) ||
    value.type !== 'leaderboard' ||
    !isString(value.dateKey) ||
    !isNumber(value.personalBest) ||
    !isNullableNumber(value.rank) ||
    !isLeaderboard(value.leaderboard)
  ) {
    return null;
  }

  return {
    type: 'leaderboard',
    dateKey: value.dateKey,
    personalBest: value.personalBest,
    rank: value.rank,
    leaderboard: value.leaderboard,
  };
};

const parseSubmitScoreResponse = (
  value: unknown
): SubmitScoreResponse | null => {
  if (
    !isRecord(value) ||
    value.type !== 'score' ||
    !isBoolean(value.accepted) ||
    !isBoolean(value.isNewBest) ||
    !isNumber(value.score) ||
    !isNumber(value.personalBest) ||
    !isNullableNumber(value.rank) ||
    !isLeaderboard(value.leaderboard)
  ) {
    return null;
  }

  return {
    type: 'score',
    accepted: value.accepted,
    isNewBest: value.isNewBest,
    score: value.score,
    personalBest: value.personalBest,
    rank: value.rank,
    leaderboard: value.leaderboard,
  };
};

const codeFromStatus = (status: number): ApiErrorCode => {
  if (status === 401) {
    return 'unauthenticated';
  }
  if (status === 429) {
    return 'rate_limited';
  }
  if (status >= 400 && status < 500) {
    return 'bad_request';
  }
  return 'server_error';
};

const parseApiError = (value: unknown, status: number): ApiError => {
  if (
    isRecord(value) &&
    value.status === 'error' &&
    isApiErrorCode(value.code) &&
    isString(value.message)
  ) {
    return {
      status: 'error',
      code: value.code,
      message: value.message,
    };
  }
  return {
    status: 'error',
    code: codeFromStatus(status),
    message: `Request failed with HTTP ${status}.`,
  };
};

const request = async <T>(
  path: string,
  options: RequestInit,
  parse: (value: unknown) => T | null
): Promise<ApiResult<T>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      return { ok: false, error: parseApiError(payload, response.status) };
    }

    const data = parse(payload);
    if (!data) {
      return {
        ok: false,
        error: {
          status: 'error',
          code: 'server_error',
          message: 'Unexpected response from the server.',
        },
      };
    }

    return { ok: true, data };
  } catch (error) {
    const isAbort =
      error instanceof Error && error.name === 'AbortError';
    return {
      ok: false,
      error: {
        status: 'error',
        code: 'server_error',
        message: isAbort
          ? 'The server took too long to respond.'
          : 'Network request failed.',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchInit = (): Promise<ApiResult<InitResponse>> => {
  return request('/api/init', { method: 'GET' }, parseInitResponse);
};

export const fetchLeaderboard = (): Promise<ApiResult<LeaderboardResponse>> => {
  return request('/api/leaderboard', { method: 'GET' }, parseLeaderboardResponse);
};

export const submitScore = (
  payload: SubmitScoreRequest
): Promise<ApiResult<SubmitScoreResponse>> => {
  return request(
    '/api/score',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    parseSubmitScoreResponse
  );
};
