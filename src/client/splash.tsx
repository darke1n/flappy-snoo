import './index.css';

import {
  context,
  requestExpandedMode,
} from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { seedFromDateKey, utcDateKey } from '../shared/daily';
import { SnooMark } from './components/SnooMark';

const CHIP_CLASS =
  'rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-reddit-text/70';

export const Splash = () => {
  const [dateKey, setDateKey] = useState(utcDateKey);
  const seed = seedFromDateKey(dateKey);
  const username = context ? context.username : undefined;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDateKey(utcDateKey());
    }, 60_000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-reddit-bg px-4 py-6 text-reddit-text">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-reddit-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-reddit-accent/10 blur-3xl" />

      <section className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/10 bg-reddit-surface/90 p-5 shadow-[0_30px_80px_-30px_rgba(255,69,0,0.45)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-reddit-accent/25 via-black/20 to-transparent">
            <SnooMark className="h-12 w-12 drop-shadow-[0_6px_10px_rgba(255,69,0,0.25)]" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-reddit-accent">
              Daily arcade
            </p>
            <p className="mt-1 font-mono text-xs text-reddit-muted">
              {dateKey} UTC
            </p>
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-black leading-none tracking-tight text-white">
          Flappy Snoo: Daily
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-reddit-text/70">
          One shared seed and one leaderboard until midnight UTC. Tap to fly,
          grab upvote arrows and keep the run alive.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={CHIP_CLASS}>+1 per pipe</span>
          <span className={CHIP_CLASS}>+2 per upvote</span>
          <span className={CHIP_CLASS}>Top 10 daily</span>
        </div>

        <button
          type="button"
          onClick={(event) =>
            requestExpandedMode(event.nativeEvent, 'game')
          }
          className="mt-4 w-full rounded-full bg-reddit-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-reddit-accent/25 transition-colors hover:bg-reddit-accent-soft active:scale-[0.99]"
        >
          Play today’s run
        </button>

        <div className="mt-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-reddit-muted">
          <span className="truncate">
            {username ? `u/${username}` : 'guest'} · score resets at 00:00 UTC
          </span>
          <span className="font-mono normal-case tracking-normal">
            0x{seed.toString(16).padStart(8, '0')}
          </span>
        </div>
      </section>
    </main>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Splash />
    </StrictMode>
  );
}
