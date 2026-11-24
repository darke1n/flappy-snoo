export type StartScreenProps = {
  dateKey: string;
  loading: boolean;
  onStart: () => void;
};

export const StartScreen = ({
  dateKey,
  loading,
  onStart,
}: StartScreenProps) => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-black/45 via-black/10 to-black/75">
      <button
        type="button"
        onClick={onStart}
        aria-label="Start today's Flappy Snoo run"
        className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-reddit-accent">
          Daily run
        </span>
        <span className="text-4xl font-black leading-none text-white">
          Flappy Snoo
        </span>
        <span className="rounded-full bg-reddit-accent px-5 py-2.5 text-sm font-bold text-white">
          Tap or Space to fly
        </span>
        <span className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-reddit-muted">
          {dateKey} UTC
        </span>
        <span className="max-w-[240px] text-xs leading-5 text-reddit-text/70">
          +1 per pipe, +2 per upvote arrow. One shared seed for every player
          until midnight UTC.
        </span>
        {loading && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-reddit-muted">
            Loading today’s seed…
          </span>
        )}
      </button>
    </div>
  );
};
