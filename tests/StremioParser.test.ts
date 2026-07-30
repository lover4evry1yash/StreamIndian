import test from 'node:test';
import assert from 'node:assert/strict';
import { StremioParser } from '../src/core/streams/gateway/StremioParser.js';

test('StremioParser.parse', async (t) => {
    await t.test('parses direct stream correctly', () => {
        const stream = {
            name: "Test",
            title: "1080p Test",
            url: "https://example.com/video.mp4"
        };
        const query = { type: 'movie' as const, mediaId: '1' };
        
        const result = StremioParser.parse(stream, query, "TestProvider");
        
        assert.ok(result);
        assert.strictEqual(result.sourceType, 'http');
        assert.strictEqual(result.url, "https://example.com/video.mp4");
        assert.strictEqual((result as any).infoHash, undefined);
        assert.strictEqual((result as any).fileIndex, undefined);
    });

    await t.test('parses torrent stream correctly', () => {
        const stream = {
            name: "Test",
            title: "1080p Torrent",
            infoHash: "0123456789abcdef0123456789abcdef01234567",
            fileIdx: 3
        };
        const query = { type: 'movie' as const, mediaId: '2' };
        
        const result = StremioParser.parse(stream, query, "TestProvider");
        
        assert.ok(result);
        assert.strictEqual(result.sourceType, 'torrent');
        assert.strictEqual(result.infoHash, "0123456789abcdef0123456789abcdef01234567");
        assert.strictEqual(result.fileIndex, 3);
        assert.strictEqual(result.magnet, "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567");
    });
});
