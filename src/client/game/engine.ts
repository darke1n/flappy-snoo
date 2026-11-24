import {
  FIELD,
  PIPE,
  SCORE,
  SNOO,
  UPVOTE,
} from '../../shared/game/config';
import { hitsGround, hitsPipePair } from '../../shared/game/collision';
import type { Circle } from '../../shared/game/types';
import { bindInput } from './input';
import { createParticleSystem } from './effects/particles';
import { createCameraEffects } from './effects/shake';
import { createRenderer } from './render';
import {
  beginRun,
  createRunState,
  spawnObstacles,
  type GamePhase,
  type RunState,
} from './state';

export type GameEvent =
  | { type: 'start' }
  | { type: 'flap' }
  | { type: 'score'; total: number; source: 'pipe' | 'upvote' }
  | { type: 'hit' }
  | { type: 'over'; score: number; durationMs: number };

export type GameEngine = {
  start: () => void;
  restart: () => void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
};

export type CreateGameEngineOptions = {
  canvas: HTMLCanvasElement;
  seed: number;
  onEvent: (event: GameEvent) => void;
};

const STEP_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;
const DEATH_DURATION_MS = 650;
const RESTART_LOCK_MS = 250;

const ANTENNA_STIFFNESS = 260;
const ANTENNA_DAMPING = 12;
const ANTENNA_IMPULSE = -6.5;
const ANTENNA_LIMIT = 0.55;

const rotateTowards = (
  current: number,
  target: number,
  factor: number
): number => {
  return current + (target - current) * Math.min(1, factor);
};

export const createGameEngine = (
  options: CreateGameEngineOptions
): GameEngine => {
  const { canvas, seed, onEvent } = options;
  const renderer = createRenderer(canvas);
  const state: RunState = createRunState();
  const particles = createParticleSystem();
  const camera = createCameraEffects();

  let destroyed = false;
  let rafId = 0;
  let lastFrame = 0;
  let accumulator = 0;
  let restartLockedUntil = 0;

  const emit = (event: GameEvent): void => {
    onEvent(event);
  };

  const startRun = (): void => {
    beginRun(state);
    spawnObstacles(state, seed);
    particles.reset();
    camera.reset();
    restartLockedUntil = 0;
    emit({ type: 'start' });
  };

  const start = (): void => {
    if (state.phase !== 'attract') {
      return;
    }
    startRun();
  };

  const restart = (): void => {
    if (state.phase !== 'over') {
      return;
    }
    startRun();
  };

  const flap = (): void => {
    if (state.phase !== 'running') {
      return;
    }
    state.snoo.vy = SNOO.flapVelocity;
    state.snoo.wing += 0.4;
    state.snoo.antennaVelocity += ANTENNA_IMPULSE;
    particles.emitFlap(SNOO.x, state.snoo.y + SNOO.radius + 2);
    emit({ type: 'flap' });
  };

  const die = (): void => {
    if (state.phase !== 'running') {
      return;
    }
    state.phase = 'dying';
    state.deathElapsedMs = 0;
    camera.addTrauma(0.85);
    camera.flash(0.9, '255, 226, 214');
    particles.emitCrash(SNOO.x, state.snoo.y);
    emit({ type: 'hit' });
  };

  const updateAntenna = (dt: number): void => {
    const acceleration =
      -ANTENNA_STIFFNESS * state.snoo.antenna -
      ANTENNA_DAMPING * state.snoo.antennaVelocity;
    state.snoo.antennaVelocity += acceleration * dt;
    state.snoo.antenna = Math.max(
      -ANTENNA_LIMIT,
      Math.min(
        ANTENNA_LIMIT,
        state.snoo.antenna + state.snoo.antennaVelocity * dt
      )
    );
  };

  const updateAttract = (dt: number): void => {
    state.worldTime += dt;
    state.snoo.wing += dt * 5;
    state.snoo.y =
      FIELD.height * 0.45 + Math.sin(state.worldTime * 2.2) * 10;
    state.snoo.rotation = Math.sin(state.worldTime * 1.4) * 0.06;
  };

  const updateSnooPhysics = (dt: number): void => {
    state.snoo.vy = Math.min(
      state.snoo.vy + SNOO.gravity * dt,
      SNOO.maxFallSpeed
    );
    state.snoo.y += state.snoo.vy * dt;
    state.snoo.wing += dt * 16;

    const targetRotation = Math.max(
      -0.5,
      Math.min(1.15, (state.snoo.vy / SNOO.maxFallSpeed) * 1.4)
    );
    state.snoo.rotation = rotateTowards(
      state.snoo.rotation,
      targetRotation,
      dt * 10
    );

    if (state.snoo.y - SNOO.radius < 0) {
      state.snoo.y = SNOO.radius;
      state.snoo.vy = Math.max(0, state.snoo.vy);
    }
  };

  const collectUpvotes = (snoo: Circle): void => {
    const pickupRadius = SNOO.hitboxRadius + UPVOTE.radius - 2;
    const pickupRadiusSquared = pickupRadius * pickupRadius;

    for (const pickup of state.pickups) {
      if (pickup.collected) {
        continue;
      }
      const dx = snoo.x - pickup.x;
      const dy = snoo.y - pickup.y;
      if (dx * dx + dy * dy > pickupRadiusSquared) {
        continue;
      }
      pickup.collected = true;
      state.score += SCORE.upvote;
      particles.emitUpvote(pickup.x, pickup.y);
      camera.flash(0.32, '255, 176, 96');
      emit({ type: 'score', total: state.score, source: 'upvote' });
    }
  };

  const scorePipes = (): void => {
    for (const pipe of state.pipes) {
      if (pipe.scored || pipe.x + PIPE.width >= SNOO.x) {
        continue;
      }
      pipe.scored = true;
      state.score += SCORE.pipe;
      emit({ type: 'score', total: state.score, source: 'pipe' });
    }
  };

  const cleanupOffscreen = (): void => {
    for (let index = state.pipes.length - 1; index >= 0; index -= 1) {
      const pipe = state.pipes[index];
      if (pipe && pipe.x + PIPE.width < -40) {
        state.pipes.splice(index, 1);
      }
    }
    for (let index = state.pickups.length - 1; index >= 0; index -= 1) {
      const pickup = state.pickups[index];
      if (pickup && pickup.x < -40) {
        state.pickups.splice(index, 1);
      }
    }
  };

  const updateRunning = (dt: number): void => {
    state.elapsedMs += dt * 1000;
    state.worldTime += dt;
    state.scrollX += PIPE.speed * dt;

    updateSnooPhysics(dt);

    for (const pipe of state.pipes) {
      pipe.x -= PIPE.speed * dt;
    }
    for (const pickup of state.pickups) {
      pickup.x -= PIPE.speed * dt;
      pickup.phase += dt * 5;
    }

    spawnObstacles(state, seed);

    const snoo: Circle = {
      x: SNOO.x,
      y: state.snoo.y,
      radius: SNOO.hitboxRadius,
    };

    scorePipes();
    collectUpvotes(snoo);

    if (hitsGround(snoo)) {
      die();
    } else {
      for (const pipe of state.pipes) {
        if (hitsPipePair(snoo, pipe)) {
          die();
          break;
        }
      }
    }

    cleanupOffscreen();
  };

  const updateDying = (dt: number): void => {
    state.deathElapsedMs += dt * 1000;
    state.worldTime += dt;
    state.snoo.vy = Math.min(
      state.snoo.vy + SNOO.gravity * dt,
      SNOO.maxFallSpeed
    );
    state.snoo.y += state.snoo.vy * dt;
    state.snoo.wing += dt * 4;
    state.snoo.rotation = Math.min(
      state.snoo.rotation + dt * 4,
      Math.PI / 2
    );

    if (
      state.deathElapsedMs >= DEATH_DURATION_MS ||
      state.snoo.y > FIELD.height
    ) {
      state.snoo.y = Math.min(
        state.snoo.y,
        FIELD.height - SNOO.radius
      );
      state.phase = 'over';
      restartLockedUntil = performance.now() + RESTART_LOCK_MS;
      emit({
        type: 'over',
        score: state.score,
        durationMs: Math.round(state.elapsedMs),
      });
    }
  };

  const step = (dt: number): void => {
    switch (state.phase) {
      case 'attract':
        updateAttract(dt);
        break;
      case 'running':
        updateRunning(dt);
        break;
      case 'dying':
        updateDying(dt);
        break;
      case 'over':
        break;
    }

    if (state.phase !== 'over') {
      updateAntenna(dt);
    }
    particles.update(dt);
    camera.update(dt);
  };

  const frame = (now: number): void => {
    if (destroyed) {
      return;
    }
    rafId = requestAnimationFrame(frame);

    if (document.hidden) {
      lastFrame = 0;
      accumulator = 0;
      return;
    }

    if (lastFrame === 0) {
      lastFrame = now;
    }

    const delta = Math.min((now - lastFrame) / 1000, MAX_FRAME_SECONDS);
    lastFrame = now;
    accumulator += delta;

    while (accumulator >= STEP_SECONDS) {
      step(STEP_SECONDS);
      accumulator -= STEP_SECONDS;
    }

    renderer.draw(state, particles, camera);
  };

  const primaryAction = (): void => {
    if (destroyed) {
      return;
    }
    if (state.phase === 'attract') {
      start();
      return;
    }
    if (state.phase === 'running') {
      flap();
      return;
    }
    if (
      state.phase === 'over' &&
      performance.now() >= restartLockedUntil
    ) {
      restart();
    }
  };

  const onVisibilityChange = (): void => {
    lastFrame = 0;
    accumulator = 0;
  };

  const unbindInput = bindInput(canvas, { primary: primaryAction });
  document.addEventListener('visibilitychange', onVisibilityChange);

  const initialRect = canvas.getBoundingClientRect();
  renderer.resize(initialRect.width, initialRect.height);
  renderer.draw(state, particles, camera);
  rafId = requestAnimationFrame(frame);

  return {
    start,
    restart,
    resize: (width, height) => {
      renderer.resize(width, height);
    },
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      cancelAnimationFrame(rafId);
      unbindInput();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
};

export type { GamePhase };
