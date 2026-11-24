import assert from 'node:assert/strict';
import test from 'node:test';
import { FIELD, PIPE, UPVOTE } from './config';
import { gapHeightForIndex, obstacleAt, obstacleOffsetX } from './obstacles';

const playableBottom = (): number => {
  return FIELD.height - FIELD.groundHeight - FIELD.bottomMargin;
};

test('obstacles are deterministic for a seed and index', () => {
  assert.deepEqual(obstacleAt(1234, 5), obstacleAt(1234, 5));
});

test('different seeds produce different layouts', () => {
  const layouts = new Set(
    [0, 1, 2, 3, 4, 5, 6, 7].map((seed) => obstacleAt(seed, 4).gapY)
  );

  assert.ok(layouts.size > 1);
});

test('gaps stay inside the playable area', () => {
  const seeds = [0, 1, 0xdeadbeef, 0xffffffff];

  for (const seed of seeds) {
    for (let index = 0; index < 120; index += 1) {
      const obstacle = obstacleAt(seed, index);
      assert.ok(obstacle.gapY >= FIELD.topMargin);
      assert.ok(obstacle.gapY + obstacle.gapH <= playableBottom());
      assert.ok(obstacle.gapH >= PIPE.minGapHeight);
      assert.ok(obstacle.gapH <= PIPE.baseGapHeight);
    }
  }
});

test('gap height shrinks from base to minimum and then plateaus', () => {
  assert.equal(gapHeightForIndex(0), PIPE.baseGapHeight);
  assert.equal(gapHeightForIndex(PIPE.gapRampStart), PIPE.baseGapHeight);
  assert.equal(
    gapHeightForIndex(PIPE.gapRampStart + PIPE.gapRampLength),
    PIPE.minGapHeight
  );
  assert.equal(gapHeightForIndex(10_000), PIPE.minGapHeight);
  assert.ok(
    gapHeightForIndex(PIPE.gapRampStart + 10) <
      gapHeightForIndex(PIPE.gapRampStart)
  );
});

test('pickups fit inside the gap with padding', () => {
  for (let index = 0; index < 200; index += 1) {
    const obstacle = obstacleAt(99, index);
    if (obstacle.pickupOffsetY === null) {
      continue;
    }
    const maxOffset =
      obstacle.gapH / 2 - UPVOTE.radius - UPVOTE.edgePadding;
    assert.ok(Math.abs(obstacle.pickupOffsetY) <= maxOffset + 1);
  }
});

test('obstacle X positions follow the configured spacing', () => {
  assert.equal(obstacleOffsetX(0), PIPE.leadInX);
  assert.equal(obstacleOffsetX(1) - obstacleOffsetX(0), PIPE.spacing);
  assert.equal(obstacleOffsetX(10) - obstacleOffsetX(9), PIPE.spacing);
});
