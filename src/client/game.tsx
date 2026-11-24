import './index.css';

import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameCanvas } from './components/GameCanvas';
import { GameHud } from './components/GameHud';
import { GameOverPanel } from './components/GameOverPanel';
import { Leaderboard } from './components/Leaderboard';
import { StartScreen } from './components/StartScreen';
import { createSfx } from './game/audio/sfx';
import type { GameEvent } from './game/engine';
import { useDailyGame } from './hooks/useDailyGame';
import { useGameEngine } from './hooks/useGameEngine';

type RunResult = {
  score: number;
  submitting: boolean;
  isNewBest: boolean;
  rank: number | null;
};

export const App = () => {
  const {
    loading,
    offline,
    username,
    dateKey,
    seed,
    personalBest,
    rank,
    leaderboard,
    lastError,
    submit,
    refresh,
  } = useDailyGame();

  const [result, setResult] = useState<RunResult | null>(null);
  const runIdRef = useRef(0);
  const [sfx] = useState(createSfx);
  const [muted, setMuted] = useState(() => sfx.isMuted());

  useEffect(() => {
    const unlock = (): void => {
      sfx.unlock();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [sfx]);

  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted, sfx]);

  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      switch (event.type) {
        case 'start':
          runIdRef.current += 1;
          setResult(null);
          return;
        case 'flap':
          sfx.flap();
          return;
        case 'score':
          if (event.source === 'upvote') {
            sfx.upvote();
          } else {
            sfx.pipe();
          }
          return;
        case 'hit':
          sfx.hit();
          return;
        case 'over': {
          const runId = runIdRef.current;
          setResult({
            score: event.score,
            submitting: true,
            isNewBest: false,
            rank: null,
          });

          void submit(event.score, event.durationMs).then((response) => {
            if (runIdRef.current !== runId) {
              return;
            }
            if (response?.isNewBest) {
              sfx.best();
            }
            setResult({
              score: event.score,
              submitting: false,
              isNewBest: response?.isNewBest ?? false,
              rank: response?.rank ?? null,
            });
          });
          return;
        }
      }
    },
    [sfx, submit]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((previous) => !previous);
  }, []);

  const { canvasRef, containerRef, phase, score, start, restart } =
    useGameEngine({ seed, onEvent: handleGameEvent });

  const best = Math.max(personalBest, result?.score ?? 0);
  const displayRank = result?.rank ?? rank;

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-reddit-bg text-reddit-text md:flex-row md:gap-4 md:p-4">
      <section className="relative min-h-0 flex-1 overflow-hidden border-white/10 bg-reddit-bg md:rounded-3xl md:border">
        <GameCanvas containerRef={containerRef} canvasRef={canvasRef} />
        <GameHud
          score={score}
          best={best}
          dateKey={dateKey}
          offline={offline}
          muted={muted}
          onToggleMute={handleToggleMute}
        />

        {phase === 'attract' && (
          <StartScreen
            dateKey={dateKey}
            loading={loading}
            onStart={start}
          />
        )}

        {phase === 'over' && result && (
          <GameOverPanel
            score={result.score}
            personalBest={best}
            rank={displayRank}
            isNewBest={result.isNewBest}
            submitting={result.submitting}
            offline={offline}
            error={lastError}
            dateKey={dateKey}
            leaderboard={leaderboard}
            onRestart={restart}
          />
        )}
      </section>

      <aside className="hidden w-80 shrink-0 flex-col gap-3 md:flex">
        <div className="rounded-2xl border border-white/10 bg-reddit-surface/90 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-reddit-accent">
            Daily seed
          </p>
          <h1 className="mt-1 text-xl font-black leading-tight text-white">
            Flappy Snoo: Daily
          </h1>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-reddit-muted">Player</dt>
            <dd className="truncate font-medium">
              {username ? `u/${username}` : 'anonymous'}
            </dd>
            <dt className="text-reddit-muted">Date</dt>
            <dd className="font-mono">{dateKey} UTC</dd>
            <dt className="text-reddit-muted">Best</dt>
            <dd className="font-mono font-semibold">{personalBest}</dd>
            <dt className="text-reddit-muted">Place</dt>
            <dd className="font-mono font-semibold">{rank ?? '—'}</dd>
            <dt className="text-reddit-muted">Seed</dt>
            <dd className="truncate font-mono text-[10px] leading-5 text-reddit-muted">
              0x{seed.toString(16).padStart(8, '0')}
            </dd>
          </dl>
          {offline && (
            <p className="mt-3 rounded-lg bg-reddit-accent/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-reddit-accent">
              Offline: local seed, score not saved
            </p>
          )}
        </div>

        <Leaderboard
          entries={leaderboard}
          dateKey={dateKey}
          className="min-h-0 flex-1"
          onRefresh={handleRefresh}
        />
      </aside>
    </main>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
