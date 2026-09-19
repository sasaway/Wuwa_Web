/* Fair Winds 아시아 서버(KST, UTC+9, 서머타임 없음) 기준 날짜 계산 (순수 함수, DOM 없음).
   UMD: 브라우저에서는 window.FwKst, Node에서는 module.exports.

   모든 함수는 epoch ms를 주고받는다. 방문자가 어느 시간대에 있든 같은 순간(epoch ms)은
   같은 결과를 내야 하므로, 브라우저 로컬 시간대를 따르는 Date 게터(getHours, getDate,
   new Date(y,m,d) 등)는 절대 쓰지 않고 getUTC 계열 게터와 Date.UTC에 고정 +9시간을 더하고 빼는
   방식으로만 계산한다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FwKst = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var OFFSET_MS = 9 * 60 * 60 * 1000; // KST = UTC+9
  var DAY_MS = 24 * 60 * 60 * 1000;
  var DEFAULT_RESET_HOUR = 5; // 05:00 KST

  function pad2(n) { return String(n).padStart(2, '0'); }

  /* epoch ms -> KST 달력 필드. UTC 게터에 +9시간을 더해서 읽으면 "KST 벽시계" 값이 된다. */
  function toParts(ms) {
    var d = new Date(ms + OFFSET_MS);
    return {
      y: d.getUTCFullYear(),
      m: d.getUTCMonth(), // 0-indexed
      d: d.getUTCDate(),
      hh: d.getUTCHours(),
      mm: d.getUTCMinutes(),
      ss: d.getUTCSeconds(),
      day: d.getUTCDay(), // 0=일 ... 6=토
    };
  }

  /* KST 벽시계 y/m(0-idx)/d/hh/mm/ss -> epoch ms */
  function fromParts(y, m, d, hh, mm, ss) {
    return Date.UTC(y, m, d, hh || 0, mm || 0, ss || 0, 0) - OFFSET_MS;
  }

  function partsToYmd(p) { return p.y + '-' + pad2(p.m + 1) + '-' + pad2(p.d); }

  /* 'YYYY-MM-DD'(KST 날짜) -> 그 날짜 hour:00 KST의 epoch ms. hour 기본값은 05시(초기화 시각) */
  function atReset(dateStr, hour) {
    var p = String(dateStr).split('-').map(Number);
    return fromParts(p[0], p[1] - 1, p[2], hour == null ? DEFAULT_RESET_HOUR : hour);
  }

  /* epoch ms -> 'YYYY-MM-DD' (KST 날짜) */
  function ymd(ms) { return partsToYmd(toParts(ms)); }

  /* now 시각이 속한 "게임 날짜" 필드. 초기화 시각(기본 05:00 KST) 이전이면 전날로 본다. */
  function gameDateParts(nowMs, hour) {
    return toParts(nowMs - (hour == null ? DEFAULT_RESET_HOUR : hour) * 3600000);
  }
  function gameDateYmd(nowMs, hour) { return partsToYmd(gameDateParts(nowMs, hour)); }

  /* now 이전(또는 그 시각)의 가장 최근 초기화 시각(기본 05:00 KST)의 epoch ms */
  function dailyStart(nowMs, hour) {
    var h = hour == null ? DEFAULT_RESET_HOUR : hour;
    var p = toParts(nowMs);
    var candidate = fromParts(p.y, p.m, p.d, h);
    if (candidate > nowMs) candidate -= DAY_MS;
    return candidate;
  }

  /* now 이전(또는 그 시각)의 가장 최근 "월요일 초기화 시각"(기본 05:00 KST)의 epoch ms */
  function weeklyStart(nowMs, hour) {
    var d = dailyStart(nowMs, hour);
    var day = toParts(d).day; // 0=일 ... 1=월 ... 6=토
    var back = (day + 6) % 7; // 월요일로부터 며칠 지났는지 (월=0, 화=1, ..., 일=6)
    return d - back * DAY_MS;
  }

  return {
    OFFSET_MS: OFFSET_MS,
    DAY_MS: DAY_MS,
    DEFAULT_RESET_HOUR: DEFAULT_RESET_HOUR,
    toParts: toParts,
    fromParts: fromParts,
    atReset: atReset,
    ymd: ymd,
    gameDateParts: gameDateParts,
    gameDateYmd: gameDateYmd,
    dailyStart: dailyStart,
    weeklyStart: weeklyStart,
  };
});
