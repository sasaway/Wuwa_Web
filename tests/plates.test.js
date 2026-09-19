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

test('use() preserves the regen phase instead of resetting the clock to "now" (partial progress is kept)', () => {
  const t0 = 1_000_000;
  const nineMin = 9 * 60 * 1000;
  const now = t0 + nineMin; // 9 minutes after t0: exactly 1 full 6-minute tick plus 3 minutes partial progress
  const result = FwPlates.use({ value: 100, at: t0 }, 10, now);
  // 100 + floor(9/6)=1 gained -> 101 available, minus 10 used -> 91
  assert.equal(result.value, 91);
  // anchored to the last completed 6-minute tick (t0+6m), not to "now" (t0+9m) — the 3 minutes of
  // partial progress since that tick are not thrown away
  assert.equal(result.at, t0 + REGEN);

  // so the next plate arrives at t0+12m (6 minutes after the anchor), not t0+15m (which a naive
  // at=now reset would give)
  const justBefore = FwPlates.estimate(result, t0 + 12 * 60 * 1000 - 1);
  const atTwelve = FwPlates.estimate(result, t0 + 12 * 60 * 1000);
  assert.equal(justBefore.value, 91);
  assert.equal(atTwelve.value, 92);
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

test('setCurrent accepts values above the natural 240 cap, up to 999 (items can push holdings past it)', () => {
  assert.deepEqual(FwPlates.setCurrent(300, 12345), { value: 300, at: 12345 });
  assert.deepEqual(FwPlates.setCurrent(999, 12345), { value: 999, at: 12345 });
});

test('setCurrent rejects out-of-bounds (negative, or above 999) and non-integer values', () => {
  assert.throws(() => FwPlates.setCurrent(-1, 0));
  assert.throws(() => FwPlates.setCurrent(1000, 0));
  assert.throws(() => FwPlates.setCurrent(1.5, 0));
  assert.throws(() => FwPlates.setCurrent(NaN, 0));
  assert.throws(() => FwPlates.setCurrent(null, 0));
});

test('estimate() does not regenerate while value is at or above 240, and never reduces a value above 240', () => {
  const at = 0;
  const now = at + 10 * REGEN; // plenty of time for natural regen to apply, if it were allowed to
  const est = FwPlates.estimate({ value: 300, at }, now);
  assert.equal(est.value, 300); // unchanged — never pulled back down toward 240
  assert.equal(est.isFull, true);
  assert.equal(est.fullAt, null);
});

test('use() subtracts normally from a value that started above 240', () => {
  const result = FwPlates.use({ value: 300, at: 0 }, 100, 0);
  assert.equal(result.value, 200);
  assert.equal(result.at, 0);
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
