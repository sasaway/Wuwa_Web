'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const FwKst = require('../assets/kst.js');

/* 이 테스트들은 항상 epoch ms만 주고받는다(TZ 환경변수를 바꾸지 않는다) — assets/kst.js가
   getUTC 계열 게터와 Date.UTC + 고정 오프셋만 쓰고 브라우저/Node 로컬 시간대 게터를 전혀
   쓰지 않으므로, 같은 timestamp를 넣으면 실행 환경의 시간대와 무관하게 항상 같은 결과가
   나와야 한다. (실제로 TZ=America/Los_Angeles와 TZ=Asia/Seoul 아래에서 별도 스크립트로도
   확인함 — 보고 참고) */

test('atReset(): "YYYY-MM-DD" + hour(KST) -> epoch ms, default hour is 05:00 KST', () => {
  // 2024-01-01 05:00 KST = 2023-12-31 20:00 UTC
  assert.equal(FwKst.atReset('2024-01-01', 5), Date.UTC(2023, 11, 31, 20, 0, 0, 0));
  assert.equal(FwKst.atReset('2024-01-01'), FwKst.atReset('2024-01-01', 5));
});

test('dailyStart(): exactly at 05:00 KST returns that same instant', () => {
  const reset = FwKst.atReset('2024-01-01', 5);
  assert.equal(FwKst.dailyStart(reset), reset);
});

test('dailyStart(): 1ms before 05:00 KST still belongs to the previous KST day', () => {
  const reset = FwKst.atReset('2024-01-01', 5);
  assert.equal(FwKst.dailyStart(reset - 1), FwKst.atReset('2023-12-31', 5));
});

test('weeklyStart(): 2024-01-01 is a Monday, so its own reset instant is the week start', () => {
  const monday = FwKst.atReset('2024-01-01', 5);
  assert.equal(FwKst.weeklyStart(monday), monday);
});

test('weeklyStart(): 1ms before Monday 05:00 KST still belongs to the previous week', () => {
  const monday = FwKst.atReset('2024-01-01', 5);
  assert.equal(FwKst.weeklyStart(monday - 1), FwKst.atReset('2023-12-25', 5));
});

test('weeklyStart(): a Sunday afternoon still belongs to the Monday of that same KST week', () => {
  // 2024-01-07 is a Sunday
  const sundayAfternoon = FwKst.atReset('2024-01-07', 15);
  assert.equal(FwKst.weeklyStart(sundayAfternoon), FwKst.atReset('2024-01-01', 5));
});

test('weeklyStart(): a Saturday just before reset still belongs to the same KST week as the day before', () => {
  // 2024-01-06 is a Saturday, one week's worth of days after the 2024-01-01 Monday
  const saturday = FwKst.atReset('2024-01-06', 4);
  assert.equal(FwKst.weeklyStart(saturday), FwKst.atReset('2024-01-01', 5));
});

test('ymd(): renders the plain KST calendar date — unlike gameDateParts(), it does not shift at the reset hour', () => {
  assert.equal(FwKst.ymd(FwKst.atReset('2024-03-05', 5)), '2024-03-05');
  assert.equal(FwKst.ymd(FwKst.atReset('2024-03-05', 23)), '2024-03-05');
  assert.equal(FwKst.ymd(FwKst.atReset('2024-03-05', 0)), '2024-03-05'); // still March 5, even before the 05:00 reset
  assert.equal(FwKst.ymd(FwKst.atReset('2024-03-05', 5) - 1), '2024-03-05'); // 04:59:59.999 is still March 5 as a plain calendar date
  assert.equal(FwKst.ymd(FwKst.atReset('2024-03-05', 0) - 1), '2024-03-04'); // midnight minus 1ms rolls the calendar date back
});

test('gameDateParts(): before the daily reset hour still counts as the previous KST day', () => {
  const reset = FwKst.atReset('2024-06-10', 5);
  const justBefore = FwKst.gameDateParts(reset - 1);
  const justAfter = FwKst.gameDateParts(reset);
  assert.deepEqual([justBefore.y, justBefore.m, justBefore.d], [2024, 5, 9]);
  assert.deepEqual([justAfter.y, justAfter.m, justAfter.d], [2024, 5, 10]);
});

test('gameDateYmd(): matches gameDateParts() formatted as YYYY-MM-DD', () => {
  const now = FwKst.atReset('2024-06-10', 12);
  assert.equal(FwKst.gameDateYmd(now), '2024-06-10');
});

test('toParts()/fromParts() round-trip for an arbitrary KST wall-clock time', () => {
  const ms = FwKst.fromParts(2025, 11, 25, 13, 45, 30); // 2025-12-25 13:45:30 KST
  const p = FwKst.toParts(ms);
  assert.deepEqual([p.y, p.m, p.d, p.hh, p.mm, p.ss], [2025, 11, 25, 13, 45, 30]);
});
