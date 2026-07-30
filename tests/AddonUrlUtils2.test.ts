import { test } from 'node:test';
import assert from 'node:assert';
import { normalizeAddonBaseUrl } from '../src/core/streams/gateway/AddonUrlUtils';

test('AddonUrlUtils configuration path preservation', () => {
    const input1 = 'https://example.com/abc123_token/manifest.json';
    const base1 = normalizeAddonBaseUrl(input1);
    assert.strictEqual(base1, 'https://example.com/abc123_token');

    const input2 = 'https://host.com/provider=123|format=json/manifest.json';
    const base2 = normalizeAddonBaseUrl(input2);
    assert.strictEqual(base2, 'https://host.com/provider=123|format=json');
});
