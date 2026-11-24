import assert from 'node:assert/strict';
import test from 'node:test';
import { hash32, mulberry32, rngForIndex } from './rng';

test('hash32 is stable, deterministic and returns a uint32', () => {
  const first = hash32('flappy-snoo:2026-11-21');
  const second = hash32('flappy-snoo:2026-11-21');

  assert.equal(first, second);
  assert.notEqual(first, hash32('flappy-snoo:2026-11-22'));
  assert.ok(Number.isInteger(first));
  assert.ok(first >= 0);
  assert.ok(first <= 0xffffffff);
});

test('mulberry32 returns values in [0, 1) and repeats for the same seed', () => {
  const a = mulberry32(123456);
  const b = mulberry32(123456);

  for (let index = 0; index < 500; index += 1) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0);
    assert.ok(value < 1);
  }
});

test('mulberry32 differs across seeds', () => {
  assert.notEqual(mulberry32(1)(), mulberry32(2)());
});

test('rngForIndex is stable for the same index', () => {
  const a = rngForIndex(0xdeadbeef, 7);
  const b = rngForIndex(0xdeadbeef, 7);

  assert.deepEqual(
    Array.from({ length: 10 }, () => a()),
    Array.from({ length: 10 }, () => b())
  );
});

test('rngForIndex produces independent streams per index', () => {
  const first = rngForIndex(42, 0);
  const second = rngForIndex(42, 1);

  assert.notDeepEqual(
    Array.from({ length: 10 }, () => first()),
    Array.from({ length: 10 }, () => second())
  );
});

test('rngForIndex handles large and negative seeds deterministically', () => {
  const a = rngForIndex(-1, 100);
  const b = rngForIndex(0xffffffff, 100);

  assert.equal(a(), b());
});
