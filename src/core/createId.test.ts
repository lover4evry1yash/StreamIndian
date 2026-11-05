import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createId } from './createId';

test('createId returns a version 4 UUID using getRandomValues only', () => {
  let calls = 0;
  const id = createId({
    getRandomValues<T extends ArrayBufferView | null>(array: T): T {
      calls += 1;
      if (array instanceof Uint8Array) array.fill(0);
      return array;
    },
  } as Pick<Crypto, 'getRandomValues'>);

  assert.equal(calls, 1);
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
});
