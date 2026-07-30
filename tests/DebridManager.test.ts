import test from 'node:test';
import assert from 'node:assert/strict';
import { DebridManager } from '../src/core/streams/debrid/DebridManager.js';
import { IDebridProvider } from '../src/core/streams/debrid/types.js';

test('DebridManager.setPreferredProvider', async (t) => {
    const mockEventBus = {} as any;
    const mockLogger = {
        info: () => {},
        warn: () => {},
        error: () => {}
    } as any;

    const manager = new DebridManager(mockEventBus, mockLogger);

    const makeProvider = (id: string): IDebridProvider => ({
        id,
        name: id,
        priority: 1,
        initialize: async () => {},
        resolve: async () => null,
        createTransfer: async () => null,
        checkTransferStatus: async () => null,
        cancelTransfer: async () => {},
        getDiagnostics: () => ({ status: 'active' } as any)
    });

    manager.registerProvider(makeProvider('realdebrid'));
    manager.registerProvider(makeProvider('torbox'));

    await t.test('default priority', () => {
        const providers = (manager as any).getPrioritizedProviders();
        assert.strictEqual(providers.length, 2);
    });

    await t.test('prefers torbox', () => {
        manager.setPreferredProvider('torbox');
        const providers = (manager as any).getPrioritizedProviders();
        assert.strictEqual(providers[0].id, 'torbox');
    });

    await t.test('prefers realdebrid', () => {
        manager.setPreferredProvider('realdebrid');
        const providers = (manager as any).getPrioritizedProviders();
        assert.strictEqual(providers[0].id, 'realdebrid');
    });
});
