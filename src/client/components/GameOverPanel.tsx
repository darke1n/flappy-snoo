import type { LeaderboardEntry } from '../../shared/api';
import { Leaderboard } from './Leaderboard';

export type GameOverPanelProps = {
  score: number;
  personalBest: number;
  rank: number | null;
  isNewBest: boolean;
  submitting: boolean;
  offline: boolean;
  error: string | null;
  dateKey: string;
  leaderboard: LeaderboardEntry[];
  onRestart: () => void;
};

export const GameOverPanel = ({
  score,
  personalBest,
  rank,
  isNewBest,
  submitting,
  offline,
  error,
  dateKey,
  leaderboard,
  onRestart,
}: GameOverPanelProps) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-label="Game over"
        className="pointer-events-auto flex max-h-full w-full max-w-sm flex-col overflow-y-auto rounded-3xl border border-white/10 bg-reddit-surface/95 p-5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-reddit-muted">
              Run over
            </p>
            <p className="mt-1 text-5xl font-black leading-none tabular-nums text-white">
              {score}
            </p>
            <p className="mt-1 text-xs text-reddit-muted">
              Today’s best: {personalBest}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {isNewBest && (
              <span className="rounded-full bg-reddit-accent px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                New best!
              </span>
            )}
            {rank !== null && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-reddit-muted">
                #{rank} today
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 min-h-4 text-xs text-reddit-muted" aria-live="polite">
          {submitting
            ? 'Saving score to Redis…'
            : offline
              ? 'Offline: score was not saved.'
              : error
                ? error
                : 'Score saved. Good luck beating it.'}
        </p>

        <Leaderboard
          entries={leaderboard}
          dateKey={dateKey}
          title="Today’s top 10"
          className="mt-4 max-h-56 border-white/5 bg-black/20"
        />

        <button
          type="button"
          onClick={onRestart}
          className="mt-4 w-full rounded-full bg-reddit-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-reddit-accent-soft active:scale-[0.99]"
        >
          Play again
        </button>
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em] text-reddit-muted">
          Tap outside or press Space
        </p>
      </div>
    </div>
  );
};
