'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const FwStore = require('../assets/store.js');

function fakeLocalStorage(){
  const store = Object.create(null);
  return {
    store,
    getItem(key){ return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value){ store[key] = String(value); },
    removeItem(key){ delete store[key]; },
  };
}

/* 최신 Node는 실험적으로 내장 localStorage를 전역에 이미 정의해 둘 수 있어(설정에 따라
   getter만 있거나 non-configurable일 수 있음), 단순 대입(`global.localStorage = fake`)은
   조용히 무시되거나 strict mode에서 던질 수 있다. defineProperty로 명시적으로 값을
   교체(writable, configurable)해야 어느 Node 버전에서도 안정적으로 테스트용 fake가 먹힌다. */
function installFakeLocalStorage(fake){
  Object.defineProperty(globalThis, 'localStorage', { value: fake, writable: true, configurable: true });
}

test('set() writes under the given prefix, not the bare key', async () => {
  const fake = fakeLocalStorage();
  installFakeLocalStorage(fake);
  const adapter = FwStore.create('wuwa_test_');
  await adapter.set('foo', 'bar');
  assert.equal(fake.store['wuwa_test_foo'], 'bar');
  assert.equal(fake.store.foo, undefined);
});

test('get() of a missing key resolves null', async () => {
  installFakeLocalStorage(fakeLocalStorage());
  const adapter = FwStore.create('wuwa_test_');
  const res = await adapter.get('missing');
  assert.equal(res, null);
});

test('set() then get() round-trips the stored string value', async () => {
  installFakeLocalStorage(fakeLocalStorage());
  const adapter = FwStore.create('wuwa_test_');
  const setRes = await adapter.set('k', '{"a":1}');
  assert.deepEqual(setRes, {value: '{"a":1}'});
  const getRes = await adapter.get('k');
  assert.deepEqual(getRes, {value: '{"a":1}'});
});

test('a throwing localStorage does not throw out of get() — resolves null instead', async () => {
  installFakeLocalStorage({
    getItem(){ throw new Error('blocked (private mode)'); },
    setItem(){ throw new Error('blocked (private mode)'); },
  });
  const adapter = FwStore.create('wuwa_test_');
  const res = await adapter.get('anything');
  assert.equal(res, null);
});

test('a throwing localStorage rejects set() so callers can show a failure message', async () => {
  installFakeLocalStorage({
    getItem(){ return null; },
    setItem(){ throw new Error('blocked (private mode)'); },
  });
  const adapter = FwStore.create('wuwa_test_');
  await assert.rejects(() => adapter.set('k', 'v'));
});

test('different prefixes keep separate keys isolated from each other', async () => {
  installFakeLocalStorage(fakeLocalStorage());
  const gacha = FwStore.create('wuwa_gacha_');
  const calc = FwStore.create('wuwa_calc_');
  await gacha.set('holdings', '1');
  await calc.set('holdings', '2');
  assert.deepEqual(await gacha.get('holdings'), {value: '1'});
  assert.deepEqual(await calc.get('holdings'), {value: '2'});
});
