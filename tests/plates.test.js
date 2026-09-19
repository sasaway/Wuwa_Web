'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const FwPlates = require('../assets/plates.js');

const REGEN = FwPlates.PLATE_REGEN_MS; // 6 * 60 * 1000
const MAX = FwPlates.PLATE_MAX; // 240

test('regen floor: under one 6-minute interval yields +0 (5m59s)', () => {
  const at = 1_000_000;
  const now = at + (REGEN - 1000); // 5m59s later
  const est = FwPlates.estimate({ value: 100, at }, now);
  assert.equal(est.value, 100);
  assert.equal(est.isFull, false);
});

test('regen floor: exactly one 6-minute interval yields +1', () => {
  const at = 1_000_000;
  const now = at + REGEN; // exactly 6m later
  const est = FwPlates.estimate({ value: 100, at }, now);
  assert.equal(est.value, 101);
});

test('regen caps at 240 and stops (isFull true, fullAt null)', () => {
  const at = 0;
  const now = at + MAX * REGEN + REGEN * 500; // way past full
  const est = FwPlates.estimate({ value: 0, at }, now);
  assert.equal(est.value, MAX);
  assert.equal(est.isFull, true);
  assert.equal(est.fullAt, null);
});

test('fullAt is correct while not yet full', () => {
  const at = 5000;
  const startValue = 200;
  const now = at + 10 * REGEN; // still short of full
  const est = FwPlates.estimate({ value: startValue, at }, now);
  assert.equal(est.isFull, false);
  assert.equal(est.fullAt, at + (MAX - startValue) * REGEN);
});

test('long idle at max, then use 60: value drops to 180, fullAt recalculated from use moment', () => {
  const at = 0;
  const now = 5 * 24 * 3600 * 1000; // 5 days idle, regen stopped at max long ago
  const result = FwPlates.use({ value: MAX, at }, 60, now);
  assert.equal(result.value, MAX - 60);
  assert.equal(result.at, now);

  const est = FwPlates.estimate(result, now);
  assert.equal(est.fullAt, now + 60 * REGEN);
  assert.equal(est.isFull, false);
});

test('use more than the current estimate is rejected, not clamped', () => {
  const plates = { value: 50, at: 0 };
  assert.throws(() => FwPlates.use(plates, 51, 0), /Error/);
  // state must remain unusable to inspect after rejection (no partial mutation)
  assert.equal(plates.value, 50);
});

test('use rejects non-positive or non-integer amounts', () => {
  const plates = { value: 50, at: 0 };
  assert.throws(() => FwPlates.use(plates, 0, 0));
  assert.throws(() => FwPlates.use(plates, -5, 0));
  assert.throws(() => FwPlates.use(plates, 1.5, 0));
});

test('use on unset plates (value null) is rejected', () => {
  const plates = { value: null, at: 0 };
  assert.throws(() => FwPlates.use(plates, 10, 0));
});

test('setCurrent accepts integers within 0..240 and stamps "at"', () => {
  assert.deepEqual(FwPlates.setCurrent(0, 12345), { value: 0, at: 12345 });
  assert.deepEqual(FwPlates.setCurrent(240, 12345), { value: 240, at: 12345 });
  assert.deepEqual(FwPlates.setCurrent(120, 99), { value: 120, at: 99 });
});

test('setCurrent rejects out-of-bounds and non-integer values', () => {
  assert.throws(() => FwPlates.setCurrent(-1, 0));
  assert.throws(() => FwPlates.setCurrent(241, 0));
  assert.throws(() => FwPlates.setCurrent(1.5, 0));
  assert.throws(() => FwPlates.setCurrent(NaN, 0));
  assert.throws(() => FwPlates.setCurrent(null, 0));
});

test('unset state (value null) is handled by estimate without throwing', () => {
  const est = FwPlates.estimate({ value: null, at: 0 }, 999999);
  assert.equal(est.value, null);
  assert.equal(est.fullAt, null);
  assert.equal(est.isFull, false);
});

test('estimate tolerates a missing/undefined plates object', () => {
  const est = FwPlates.estimate(undefined, 1000);
  assert.equal(est.value, null);
  assert.equal(est.isFull, false);
});
