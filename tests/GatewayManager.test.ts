import test from 'node:test';
import assert from 'node:assert/strict';
import { GatewayManager } from '../src/core/streams/gateway/GatewayManager.js';

test('GatewayManager.ProviderRegistry', async (t) => {
    const query = { type: 'movie' as const, mediaId: '1' };

    await t.test('zero configured addons => zero providers', async () => {
        const manager = new GatewayManager();
        await manager.search(query, { addons: [] });
        const getRegistrySize = () => Object.keys(manager.getDiagnostics().providers).length;
        assert.strictEqual(getRegistrySize(), 0);
    });

    await t.test('one configured addon => one provider', async () => {
        const manager = new GatewayManager();
        await manager.search(query, { addons: ['https://example.com/manifest.json'] });
        const getRegistrySize = () => Object.keys(manager.getDiagnostics().providers).length;
        assert.strictEqual(getRegistrySize(), 1);
    });

    await t.test('same addon twice => no duplicate provider', async () => {
        const manager = new GatewayManager();
        await manager.search(query, { addons: ['https://example.com/manifest.json', 'https://example.com/manifest.json'] });
        const getRegistrySize = () => Object.keys(manager.getDiagnostics().providers).length;
        assert.strictEqual(getRegistrySize(), 1);
    });

    await t.test('two different addon URLs that generate the same opaque ID handle collisions', async () => {
        const manager = new GatewayManager();
        await manager.search(query, { 
            addons: [
                'https://example.com/manifest.json',
                'https://example.org/manifest.json'
            ] 
        });
        const getRegistrySize = () => Object.keys(manager.getDiagnostics().providers).length;
        assert.strictEqual(getRegistrySize(), 2);
    });
});
