import test from 'node:test';
import assert from 'node:assert/strict';
import { StreamResolutionService } from '../src/core/streams/services/StreamResolutionService.js';
import { CanonicalStreamSource } from '../src/core/streams/types.js';

test('StreamResolutionService', async (t) => {
    let debridResolvedCalled = 0;
    let transferInitiatedCalled = 0;

    const mockResolutionManager = {
        resolveStreamUrl: async (source: CanonicalStreamSource) => source.url || null
    } as any;

    const mockDebridManager = {
        resolve: async () => {
            debridResolvedCalled++;
            return { url: null, providerId: null };
        }
    } as any;

    const mockTransferManager = {
        initiateTransfer: async () => {
            transferInitiatedCalled++;
            return { result: null, providerId: null };
        }
    } as any;

    const service = new StreamResolutionService(
        mockResolutionManager,
        mockDebridManager,
        mockTransferManager
    );

    await t.test('direct playback bypasses debrid', async () => {
        debridResolvedCalled = 0;
        transferInitiatedCalled = 0;
        
        const directSource: CanonicalStreamSource = {
            id: '1',
            title: '1080p Test',
            type: 'movie',
            sourceType: 'http',
            url: 'https://example.com/video.mp4',
            quality: '1080p'
        };

        const result = await service.prepareStream(directSource);
        
        assert.ok(result);
        assert.strictEqual(result.url, 'https://example.com/video.mp4');
        assert.strictEqual(debridResolvedCalled, 0, 'DebridManager.resolve should NOT be called');
        assert.strictEqual(transferInitiatedCalled, 0, 'TransferManager.initiateTransfer should NOT be called');
    });

    await t.test('missing hash test', async () => {
        debridResolvedCalled = 0;
        transferInitiatedCalled = 0;

        const missingHashSource: CanonicalStreamSource = {
            id: '2',
            title: '1080p Torrent No Hash',
            type: 'movie',
            sourceType: 'torrent',
            quality: '1080p',
            // NO infoHash
            // NO magnet
        };

        const result = await service.prepareStream(missingHashSource);
        
        assert.strictEqual(result, null, 'Should return null if hash is missing');
        assert.strictEqual(debridResolvedCalled, 0, 'DebridManager.resolve should NOT be called');
        assert.strictEqual(transferInitiatedCalled, 0, 'TransferManager.initiateTransfer should NOT be called');
    });
});
