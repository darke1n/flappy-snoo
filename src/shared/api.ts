export type LeaderboardEntry = {
  /** 1-based position, highest score first. */
  rank: number;
  username: string;
  score: number;
  isCurrentUser: boolean;
};

export type DailyInfo = {
  /** UTC day in `YYYY-MM-DD` form. */
  dateKey: string;
  /** Deterministic 32-bit level seed derived from `dateKey`. */
  seed: number;
};

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  daily: DailyInfo;
  personalBest: number;
  rank: number | null;
  leaderboard: LeaderboardEntry[];
};

export type SubmitScoreRequest = {
  score: number;
  durationMs: number;
};

export type SubmitScoreResponse = {
  type: 'score';
  accepted: boolean;
  isNewBest: boolean;
  score: number;
  personalBest: number;
  rank: number | null;
  leaderboard: LeaderboardEntry[];
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  dateKey: string;
  personalBest: number;
  rank: number | null;
  leaderboard: LeaderboardEntry[];
};

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthenticated'
  | 'rate_limited'
  | 'server_error';

export type ApiError = {
  status: 'error';
  code: ApiErrorCode;
  message: string;
};
