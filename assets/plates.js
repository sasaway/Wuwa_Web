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

  var PLATE_MAX = 240; // 자연 회복 상한 (6분에 1개, 하루 240개)
  var PLATE_INPUT_MAX = 999; // 아이템으로 240을 넘겨 보유할 수 있어 입력 상한은 더 크게 잡는다
  var PLATE_REGEN_MS = 6 * 60 * 1000; // 6분에 1개, 하루 240개

  function fwError(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
  }

  /* plates: {value, at} | null/undefined, value이 null이면 아직 입력 전 상태.
     value가 240 이상이면(아이템으로 자연 상한을 넘겨 보유한 경우 포함) 자연 회복이 붙지 않고,
     값을 240 쪽으로 줄이지도 않는다 — 있는 그대로 유지한다. */
  function estimate(plates, now) {
    if (!plates || plates.value == null) {
      return { value: null, fullAt: null, isFull: false };
    }
    if (plates.value >= PLATE_MAX) {
      return { value: plates.value, fullAt: null, isFull: true };
    }
    var gained = Math.floor(Math.max(0, now - plates.at) / PLATE_REGEN_MS);
    var value = Math.min(PLATE_MAX, plates.value + gained);
    var isFull = value >= PLATE_MAX;
    var fullAt = isFull ? null : plates.at + (PLATE_MAX - plates.value) * PLATE_REGEN_MS;
    return { value: value, fullAt: fullAt, isFull: isFull };
  }

  function setCurrent(value, now) {
    if (!Number.isInteger(value) || value < 0 || value > PLATE_INPUT_MAX) {
      throw fwError('invalid_value', '플레이트 개수는 0~' + PLATE_INPUT_MAX + ' 사이 정수로 입력해 주세요.');
    }
    return { value: value, at: now };
  }

  /* amount만큼 소모한 뒤 회복 기준 시각(at)을 다시 찍는데, 가득 찬 상태(240 이상)에서 쓴 게
     아니라면 "지금(now)"이 아니라 "마지막으로 다 채워진 6분 눈금"으로 앵커를 옮긴다.
     그래야 그 눈금 이후 흘러간(아직 1개로 반영되지 않은) 회복 진행분이 버려지지 않고 다음
     소모 이후에도 이어진다. 가득 찬 상태에서 썼다면 그 전의 유휴 시간은 어차피 의미가 없으므로
     at = now로 리셋한다. */
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
    var at;
    if (est.isFull) {
      at = now;
    } else {
      var gained = Math.floor(Math.max(0, now - plates.at) / PLATE_REGEN_MS);
      at = plates.at + gained * PLATE_REGEN_MS;
    }
    return { value: est.value - amount, at: at };
  }

  return {
    PLATE_MAX: PLATE_MAX,
    PLATE_INPUT_MAX: PLATE_INPUT_MAX,
    PLATE_REGEN_MS: PLATE_REGEN_MS,
    estimate: estimate,
    setCurrent: setCurrent,
    use: use,
  };
});
