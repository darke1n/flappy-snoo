import type { LeaderboardEntry } from '../../shared/api';

export type LeaderboardProps = {
  entries: LeaderboardEntry[];
  dateKey: string;
  title?: string;
  className?: string;
  onRefresh?: () => void;
};

const medalClass = (rank: number): string => {
  if (rank === 1) {
    return 'text-reddit-accent';
  }
  if (rank === 2) {
    return 'text-reddit-text';
  }
  if (rank === 3) {
    return 'text-reddit-accent-soft';
  }
  return 'text-reddit-muted';
};

export const Leaderboard = ({
  entries,
  dateKey,
  title = 'Today’s top 10',
  className = '',
  onRefresh,
}: LeaderboardProps) => {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-2xl border border-white/10 bg-reddit-surface/90 p-4 ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-reddit-text">{title}</h2>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-reddit-muted">
            {dateKey} UTC
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-reddit-muted transition-colors hover:border-reddit-accent hover:text-reddit-text"
          >
            Refresh
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-xs leading-5 text-reddit-muted">
          Nobody has scored yet. Take the first spot on today’s board.
        </p>
      ) : (
        <ol className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {entries.map((entry) => (
            <li
              key={entry.username}
              className={`grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                entry.isCurrentUser
                  ? 'bg-reddit-accent/15 text-reddit-text'
                  : 'text-reddit-text/80'
              }`}
            >
              <span
                className={`text-right font-mono text-xs font-bold ${medalClass(entry.rank)}`}
              >
                {entry.rank}
              </span>
              <span className="truncate">
                u/{entry.username}
                {entry.isCurrentUser && (
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-reddit-accent">
                    you
                  </span>
                )}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
