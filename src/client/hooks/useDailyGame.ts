import { useCallback, useEffect, useState } from 'react';
import type { LeaderboardEntry, SubmitScoreResponse } from '../../shared/api';
import { seedFromDateKey, utcDateKey } from '../../shared/daily';
import {
  fetchInit,
  fetchLeaderboard,
  submitScore as submitScoreRequest,
} from '../api/client';

export type DailyGameState = {
  loading: boolean;
  offline: boolean;
  username: string;
  dateKey: string;
  seed: number;
  personalBest: number;
  rank: number | null;
  leaderboard: LeaderboardEntry[];
  submitting: boolean;
  lastError: string | null;
};

const createInitialState = (): DailyGameState => {
  const dateKey = utcDateKey();
  return {
    loading: true,
    offline: false,
    username: '',
    dateKey,
    seed: seedFromDateKey(dateKey),
    personalBest: 0,
    rank: null,
    leaderboard: [],
    submitting: false,
    lastError: null,
  };
};

export const useDailyGame = () => {
  const [state, setState] = useState<DailyGameState>(createInitialState);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result = await fetchInit();
      if (cancelled) {
        return;
      }

      if (result.ok) {
        const data = result.data;
        setState({
          loading: false,
          offline: false,
          username: data.username,
          dateKey: data.daily.dateKey,
          seed: data.daily.seed,
          personalBest: data.personalBest,
          rank: data.rank,
          leaderboard: data.leaderboard,
          submitting: false,
          lastError: null,
        });
        return;
      }

      setState((previous) => ({
        ...previous,
        loading: false,
        offline: true,
        lastError: result.error.message,
      }));
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const result = await fetchLeaderboard();
    if (result.ok) {
      const data = result.data;
      setState((previous) => ({
        ...previous,
        offline: false,
        dateKey: data.dateKey,
        seed: seedFromDateKey(data.dateKey),
        personalBest: data.personalBest,
        rank: data.rank,
        leaderboard: data.leaderboard,
        lastError: null,
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      lastError: result.error.message,
    }));
  }, []);

  const submit = useCallback(
    async (
      score: number,
      durationMs: number
    ): Promise<SubmitScoreResponse | null> => {
      setState((previous) => ({ ...previous, submitting: true }));

      const result = await submitScoreRequest({ score, durationMs });
      if (!result.ok) {
        setState((previous) => ({
          ...previous,
          submitting: false,
          lastError: result.error.message,
        }));
        return null;
      }

      const data = result.data;
      setState((previous) => ({
        ...previous,
        submitting: false,
        offline: false,
        personalBest: data.personalBest,
        rank: data.rank,
        leaderboard: data.leaderboard,
        lastError: null,
      }));
      return data;
    },
    []
  );

  return {
    ...state,
    refresh,
    submit,
  } as const;
};
