/* Fair Winds 결정 플레이트 계산 (순수 함수, DOM 없음).
   UMD: 브라우저에서는 window.FwPlates, Node에서는 module.exports. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FwPlates = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PLATE_MAX = 240;
  var PLATE_REGEN_MS = 6 * 60 * 1000; // 6분에 1개, 하루 240개

  function fwError(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
  }

  /* plates: {value, at} | null/undefined, value이 null이면 아직 입력 전 상태 */
  function estimate(plates, now) {
    if (!plates || plates.value == null) {
      return { value: null, fullAt: null, isFull: false };
    }
    var gained = Math.floor(Math.max(0, now - plates.at) / PLATE_REGEN_MS);
    var value = Math.min(PLATE_MAX, plates.value + gained);
    var isFull = value >= PLATE_MAX;
    var fullAt = isFull ? null : plates.at + (PLATE_MAX - plates.value) * PLATE_REGEN_MS;
    return { value: value, fullAt: fullAt, isFull: isFull };
  }

  function setCurrent(value, now) {
    if (!Number.isInteger(value) || value < 0 || value > PLATE_MAX) {
      throw fwError('invalid_value', '플레이트 개수는 0~' + PLATE_MAX + ' 사이 정수로 입력해 주세요.');
    }
    return { value: value, at: now };
  }

  /* amount만큼 소모한 뒤, at = now로 다시 찍는다.
     그 결과 6분 회복 타이머는 항상 "마지막으로 사용한 시점"부터 다시 시작되는 단순화된 모델이며,
     240에서 멈춰 있던 유휴 시간은 estimate()가 240으로 캡을 씌우는 순간 자연히 버려진다. */
  function use(plates, amount, now) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw fwError('invalid_amount', '사용량은 1 이상의 정수로 입력해 주세요.');
    }
    var est = estimate(plates, now);
    if (est.value == null) {
      throw fwError('not_set', '먼저 지금 보유한 플레이트 개수를 입력해 주세요.');
    }
    if (amount > est.value) {
      throw fwError(
        'insufficient',
        '현재 보유량(' + est.value + '개)보다 많이 사용할 수 없습니다. 지금 개수를 다시 확인해 주세요.'
      );
    }
    return { value: est.value - amount, at: now };
  }

  return {
    PLATE_MAX: PLATE_MAX,
    PLATE_REGEN_MS: PLATE_REGEN_MS,
    estimate: estimate,
    setCurrent: setCurrent,
    use: use,
  };
});
