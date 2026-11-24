import assert from 'node:assert/strict';
import test from 'node:test';
import { FIELD, PIPE } from './config';
import {
  circleHitsRect,
  groundY,
  hitsCeiling,
  hitsGround,
  hitsPipePair,
  pipeRects,
} from './collision';
import type { Circle, PipePair } from './types';

const snoo = (x: number, y: number): Circle => {
  return { x, y, radius: 13 };
};

test('circleHitsRect detects inside, outside and tangent cases', () => {
  const rect = { x: 100, y: 100, w: 50, h: 50 };

  assert.equal(circleHitsRect(snoo(120, 120), rect), true);
  assert.equal(circleHitsRect(snoo(10, 10), rect), false);
  assert.equal(circleHitsRect(snoo(100 - 13, 120), rect), true);
  assert.equal(circleHitsRect(snoo(100 - 13.01, 120), rect), false);
  assert.equal(circleHitsRect(snoo(100 + 25, 100 + 25), rect), true);
});

test('pipe rects cover the column above and below the gap', () => {
  const pipe: PipePair = { id: 1, x: 200, gapY: 200, gapH: 180, scored: false };
  const [top, bottom] = pipeRects(pipe);

  assert.deepEqual(top, { x: 200, y: 0, w: PIPE.width, h: 200 });
  assert.equal(bottom.y, 380);
  assert.equal(bottom.h, groundY() - 380);
});

test('a circle in the gap does not collide with the pipe pair', () => {
  const pipe: PipePair = { id: 1, x: 200, gapY: 180, gapH: 200, scored: false };

  assert.equal(hitsPipePair(snoo(220, 280), pipe), false);
  assert.equal(hitsPipePair(snoo(220, 190), pipe), true);
  assert.equal(hitsPipePair(snoo(220, 370), pipe), true);
});

test('ground and ceiling collisions respect the hitbox radius', () => {
  const floor = groundY();
  assert.equal(hitsGround(snoo(100, floor - 13.01)), false);
  assert.equal(hitsGround(snoo(100, floor - 12.99)), true);

  assert.equal(hitsCeiling(snoo(100, 13.01)), false);
  assert.equal(hitsCeiling(snoo(100, 13)), true);

  assert.equal(groundY(FIELD.height), FIELD.height - FIELD.groundHeight);
});
