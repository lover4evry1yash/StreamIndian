import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Logger } from './Logger';
import { NetworkClient } from './NetworkClient';

test('bounded JSON responses parse valid payloads and reject oversized streams', async () => {
  const previousFetch = globalThis.fetch;
  const client = new NetworkClient(new Logger());
  try {
    globalThis.fetch = async () => new Response('{"ok":true}', { status: 200 });
    assert.deepEqual(await client.getJson('https://example.test/small', { maxResponseBytes: 32 }), { ok: true });

    globalThis.fetch = async () => new Response('{"payload":"this response is too large"}', { status: 200 });
    await assert.rejects(
      client.getJson('https://example.test/large', { maxResponseBytes: 12 }),
      /JSON response exceeds the 12 byte limit/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('concurrent duplicate requests share a fetch while both callers can read the body', async () => {
  const previousFetch = globalThis.fetch;
  const client = new NetworkClient(new Logger());
  let fetchCount = 0;
  try {
    globalThis.fetch = async () => {
      fetchCount++;
      await Promise.resolve();
      return new Response('shared body', { status: 200 });
    };
    const [first, second] = await Promise.all([
      client.getText('https://example.test/shared', { retries: 0 }),
      client.getText('https://example.test/shared', { retries: 0 }),
    ]);
    assert.equal(first, 'shared body');
    assert.equal(second, 'shared body');
    assert.equal(fetchCount, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('network errors redact provider username and password query values', async () => {
  const previousFetch = globalThis.fetch;
  const client = new NetworkClient(new Logger());
  try {
    const request = new URL('https://provider.example.test/player_api.php');
    request.searchParams.set('username', 'YOUR_USER');
    request.searchParams.set('password', 'PASSWORD_PLACEHOLDER');
    globalThis.fetch = async () => {
      throw new TypeError(`network error for ${request.toString()}`);
    };
    await assert.rejects(client.getText(request.toString(), { retries: 0 }), (error: Error) => {
      assert.match(error.message, /username=\[redacted\]/);
      assert.match(error.message, /password=\[redacted\]/);
      assert.doesNotMatch(error.message, /YOUR_USER|PASSWORD_PLACEHOLDER/);
      return true;
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
