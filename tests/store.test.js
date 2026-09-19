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

test('set() writes under the given prefix, not the bare key', async () => {
  const fake = fakeLocalStorage();
  global.localStorage = fake;
  const adapter = FwStore.create('wuwa_test_');
  await adapter.set('foo', 'bar');
  assert.equal(fake.store['wuwa_test_foo'], 'bar');
  assert.equal(fake.store.foo, undefined);
});

test('get() of a missing key resolves null', async () => {
  global.localStorage = fakeLocalStorage();
  const adapter = FwStore.create('wuwa_test_');
  const res = await adapter.get('missing');
  assert.equal(res, null);
});

test('set() then get() round-trips the stored string value', async () => {
  global.localStorage = fakeLocalStorage();
  const adapter = FwStore.create('wuwa_test_');
  const setRes = await adapter.set('k', '{"a":1}');
  assert.deepEqual(setRes, {value: '{"a":1}'});
  const getRes = await adapter.get('k');
  assert.deepEqual(getRes, {value: '{"a":1}'});
});

test('a throwing localStorage does not throw out of get() — resolves null instead', async () => {
  global.localStorage = {
    getItem(){ throw new Error('blocked (private mode)'); },
    setItem(){ throw new Error('blocked (private mode)'); },
  };
  const adapter = FwStore.create('wuwa_test_');
  const res = await adapter.get('anything');
  assert.equal(res, null);
});

test('a throwing localStorage rejects set() so callers can show a failure message', async () => {
  global.localStorage = {
    getItem(){ return null; },
    setItem(){ throw new Error('blocked (private mode)'); },
  };
  const adapter = FwStore.create('wuwa_test_');
  await assert.rejects(() => adapter.set('k', 'v'));
});

test('different prefixes keep separate keys isolated from each other', async () => {
  const fake = fakeLocalStorage();
  global.localStorage = fake;
  const gacha = FwStore.create('wuwa_gacha_');
  const calc = FwStore.create('wuwa_calc_');
  await gacha.set('holdings', '1');
  await calc.set('holdings', '2');
  assert.deepEqual(await gacha.get('holdings'), {value: '1'});
  assert.deepEqual(await calc.get('holdings'), {value: '2'});
});
