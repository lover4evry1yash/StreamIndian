import test from 'node:test';
import assert from 'node:assert/strict';
import { SettingsManager } from '../src/core/storage/SettingsManager.js';

test('SettingsManager migration', async (t) => {
    await t.test('migrates legacy torbox API key', async () => {
        const mockStorage = {
            data: {
                'streamindian_settings_v2': {
                    providers: { torbox: { apiKey: 'OLD_API_KEY' } },
                    streams: {}
                }
            } as any,
            get: async (k: string) => mockStorage.data[k],
            set: async (k: string, v: any) => { mockStorage.data[k] = v; },
            remove: async () => {},
            clear: async () => {}
        };
        const mockEventBus = { emit: () => {} } as any;

        const manager = new SettingsManager(mockStorage as any, mockEventBus);
        await manager.initialize();
        
        const settings = manager.getSettings();
        assert.strictEqual(settings.streams.torboxApiKey, 'OLD_API_KEY');
        assert.strictEqual((settings.providers.torbox as any).apiKey, undefined);
    });

    await t.test('does not overwrite existing canonical torbox API key', async () => {
        const mockStorage = {
            data: {
                'streamindian_settings_v2': {
                    providers: { torbox: { apiKey: 'OLD_API_KEY' } },
                    streams: { torboxApiKey: 'NEW_API_KEY' }
                }
            } as any,
            get: async (k: string) => mockStorage.data[k],
            set: async (k: string, v: any) => { mockStorage.data[k] = v; },
            remove: async () => {},
            clear: async () => {}
        };
        const mockEventBus = { emit: () => {} } as any;

        const manager = new SettingsManager(mockStorage as any, mockEventBus);
        await manager.initialize();
        
        const settings = manager.getSettings();
        assert.strictEqual(settings.streams.torboxApiKey, 'NEW_API_KEY');
    });
});
