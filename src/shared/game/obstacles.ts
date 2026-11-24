import { FIELD, PIPE, UPVOTE } from './config';
import { clamp, lerp } from './math';
import { rngForIndex } from './rng';
import type { ObstacleSpec } from './types';

/** Gap narrows from `baseGapHeight` to `minGapHeight` during the first few pipes. */
export const gapHeightForIndex = (index: number): number => {
  const progress = clamp(
    (index - PIPE.gapRampStart) / PIPE.gapRampLength,
    0,
    1
  );
  return Math.round(
    lerp(PIPE.baseGapHeight, PIPE.minGapHeight, progress)
  );
};

/** World-space X of an obstacle column. Pipes travel left as the world scrolls. */
export const obstacleOffsetX = (index: number): number => {
  return PIPE.leadInX + index * PIPE.spacing;
};

/**
 * Pure, deterministic description of obstacle `index` for a daily seed.
 * The same `(seed, index)` always produces the same gap and upvote, no matter
 * when or in which order obstacles are generated.
 */
export const obstacleAt = (
  seed: number,
  index: number,
  fieldHeight: number = FIELD.height
): ObstacleSpec => {
  const rng = rngForIndex(seed, index);
  const gapH = gapHeightForIndex(index);

  const playableTop = FIELD.topMargin;
  const playableBottom =
    fieldHeight - FIELD.groundHeight - FIELD.bottomMargin;
  const maxGapY = Math.max(playableTop, playableBottom - gapH);
  const gapY = Math.round(lerp(playableTop, maxGapY, rng()));

  const hasUpvote = rng() < UPVOTE.chance;
  const maxOffset = Math.max(
    0,
    gapH / 2 - UPVOTE.radius - UPVOTE.edgePadding
  );
  const pickupOffsetY = hasUpvote
    ? Math.round((rng() * 2 - 1) * maxOffset)
    : null;

  return {
    index,
    gapY,
    gapH,
    pickupOffsetY,
  };
};
