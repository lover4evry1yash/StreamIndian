import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAddonBaseUrl } from '../src/core/streams/gateway/AddonUrlUtils.js';

test('AddonUrlUtils.normalizeAddonBaseUrl', async (t) => {
    await t.test('strips manifest.json', () => {
        assert.strictEqual(normalizeAddonBaseUrl('https://example.com/manifest.json'), 'https://example.com');
    });

    await t.test('strips trailing slashes', () => {
        assert.strictEqual(normalizeAddonBaseUrl('https://example.com/'), 'https://example.com');
        assert.strictEqual(normalizeAddonBaseUrl('https://example.com/manifest.json/'), 'https://example.com');
    });

    await t.test('preserves configuration paths', () => {
        assert.strictEqual(normalizeAddonBaseUrl('https://example.com/config123/manifest.json'), 'https://example.com/config123');
        assert.strictEqual(normalizeAddonBaseUrl('https://example.com/torbox=SECRET/manifest.json'), 'https://example.com/torbox=SECRET');
    });

    await t.test('rejects query strings', () => {
        assert.throws(() => {
            normalizeAddonBaseUrl('https://example.com/config/manifest.json?token=SECRET');
        }, /Query strings are not supported/);
    });
});
