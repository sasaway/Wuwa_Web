/* Fair Winds 공용 저장소 어댑터 (localStorage 기반, DOM 없음).
   UMD: 브라우저에서는 window.FwStore, Node에서는 module.exports.
   세 페이지가 각자 들고 있던 "window.storage(Claude 아티팩트 미리보기 전용 API)가 있으면
   그걸, 없으면 localStorage" 어댑터를 하나로 모은 것. 공개 배포판에는 window.storage가
   없으므로 항상 localStorage만 쓴다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FwStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* prefix가 붙은 localStorage 키로 get/set 하는 어댑터를 만든다.
     get은 실패해도(비공개 모드, 저장소 차단 등) 예외를 던지지 않고 null로 대체해서
     호출부가 기본값으로 넘어갈 수 있게 하고, set은 실패를 그대로 알 수 있도록 던져서
     호출부가 저장 실패 토스트를 띄울 수 있게 한다. */
  function create(prefix) {
    return {
      get: function (key) {
        try {
          var v = localStorage.getItem(prefix + key);
          return Promise.resolve(v == null ? null : { value: v });
        } catch (e) {
          return Promise.resolve(null);
        }
      },
      set: function (key, value) {
        try {
          localStorage.setItem(prefix + key, value);
          return Promise.resolve({ value: value });
        } catch (e) {
          return Promise.reject(e);
        }
      },
    };
  }

  return { create: create };
});
