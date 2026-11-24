export type GameHudProps = {
  score: number;
  best: number;
  dateKey: string;
  offline: boolean;
  muted: boolean;
  onToggleMute: () => void;
};

export const GameHud = ({
  score,
  best,
  dateKey,
  offline,
  muted,
  onToggleMute,
}: GameHudProps) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
      <div className="rounded-2xl bg-black/35 px-4 py-2 backdrop-blur-sm">
        <p className="text-4xl font-black leading-none tabular-nums text-white">
          {score}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-reddit-muted">
          Score
        </p>
      </div>

      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          aria-pressed={muted}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/35 text-reddit-text backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H3v6h3l5 4z" />
            {muted ? (
              <>
                <path d="m16 9 5 6" />
                <path d="m21 9-5 6" />
              </>
            ) : (
              <>
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </>
            )}
          </svg>
        </button>

        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-reddit-text backdrop-blur-sm">
            BEST {best}
          </span>
          <span className="rounded-full bg-black/35 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-reddit-muted backdrop-blur-sm">
            {dateKey} UTC
          </span>
          {offline && (
            <span className="rounded-full bg-reddit-accent/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-reddit-accent">
              Offline
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
