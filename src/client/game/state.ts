import { FIELD, PIPE, SNOO } from '../../shared/game/config';
import { obstacleAt, obstacleOffsetX } from '../../shared/game/obstacles';
import type { Pickup, PipePair } from '../../shared/game/types';

export type GamePhase = 'attract' | 'running' | 'dying' | 'over';

export type SnooState = {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  wing: number;
  /** Damped spring offset for the antenna; kicked on every flap. */
  antenna: number;
  antennaVelocity: number;
};

export type RunState = {
  phase: GamePhase;
  score: number;
  elapsedMs: number;
  deathElapsedMs: number;
  worldTime: number;
  scrollX: number;
  nextObstacleIndex: number;
  snoo: SnooState;
  pipes: PipePair[];
  pickups: Pickup[];
};

/** Extra distance beyond the right edge before a new obstacle is spawned. */
const SPAWN_MARGIN = 80;

const spawnY = (): number => {
  return FIELD.height * 0.45;
};

export const createRunState = (): RunState => {
  const state: RunState = {
    phase: 'attract',
    score: 0,
    elapsedMs: 0,
    deathElapsedMs: 0,
    worldTime: 0,
    scrollX: 0,
    nextObstacleIndex: 0,
    snoo: {
      x: SNOO.x,
      y: spawnY(),
      vy: 0,
      rotation: 0,
      wing: 0,
      antenna: 0,
      antennaVelocity: 0,
    },
    pipes: [],
    pickups: [],
  };
  return state;
};

export const enterAttract = (state: RunState): void => {
  state.phase = 'attract';
  state.score = 0;
  state.elapsedMs = 0;
  state.deathElapsedMs = 0;
  state.worldTime = 0;
  state.scrollX = 0;
  state.nextObstacleIndex = 0;
  state.pipes.length = 0;
  state.pickups.length = 0;
  state.snoo.y = spawnY();
  state.snoo.vy = 0;
  state.snoo.rotation = 0;
  state.snoo.wing = 0;
  state.snoo.antenna = 0;
  state.snoo.antennaVelocity = 0;
};

export const beginRun = (state: RunState): void => {
  state.phase = 'running';
  state.score = 0;
  state.elapsedMs = 0;
  state.deathElapsedMs = 0;
  state.worldTime = 0;
  state.scrollX = 0;
  state.nextObstacleIndex = 0;
  state.pipes.length = 0;
  state.pickups.length = 0;
  state.snoo.y = spawnY();
  state.snoo.vy = SNOO.flapVelocity * 0.6;
  state.snoo.rotation = -0.2;
  state.snoo.wing = 0;
  state.snoo.antenna = 0;
  state.snoo.antennaVelocity = 0;
};

/**
 * Adds every obstacle whose world position is about to enter the screen.
 * Positions come from the pure daily generator, so the sequence is identical
 * for all players and independent of frame rate.
 */
export const spawnObstacles = (state: RunState, seed: number): void => {
  const spawnLine = FIELD.width + SPAWN_MARGIN;

  while (obstacleOffsetX(state.nextObstacleIndex) - state.scrollX < spawnLine) {
    const index = state.nextObstacleIndex;
    const spec = obstacleAt(seed, index, FIELD.height);
    const x = obstacleOffsetX(index) - state.scrollX;

    state.pipes.push({
      id: index,
      x,
      gapY: spec.gapY,
      gapH: spec.gapH,
      scored: false,
    });

    if (spec.pickupOffsetY !== null) {
      state.pickups.push({
        id: index,
        x: x + PIPE.width / 2,
        y: spec.gapY + spec.gapH / 2 + spec.pickupOffsetY,
        phase: index * 0.7,
        collected: false,
      });
    }

    state.nextObstacleIndex += 1;
  }
};
