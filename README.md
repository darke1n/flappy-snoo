# Flappy Snoo: Daily

A seeded daily arcade game built natively for Reddit using the Devvit platform. Every player faces the exact same obstacle layout each day, competing for the top spot on the subreddit leaderboard.

## Key Features
- **Deterministic Daily Seed:** Identical level generation for all players within a 24-hour cycle.
- **Live Subreddit Leaderboard:** Real-time score tracking and ranking powered by Redis.
- **Native Reddit Integration:** Playable directly inside a Reddit post without leaving the feed.

## Tech Stack
- **Platform:** Reddit Devvit
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend & Storage:** Hono, Redis
