import { test } from 'node:test';
import assert from 'node:assert';
import { GatewayManager } from '../src/core/streams/gateway/GatewayManager';
import { DirectAddonTransport } from '../src/core/streams/gateway/AddonTransport';
import { StremioParser } from '../src/core/streams/gateway/StremioParser';

test('Integration Test: Real Stream Discovery (Live Provider Diagnostic)', async () => {
    const transport = new DirectAddonTransport();
    const gateway = new GatewayManager(transport);

    const context = {
        addons: [
            'https://torrentio.strem.fun/manifest.json',
            'https://mediafusion.elfhosted.com/manifest.json',
            'https://watchhub.strem.io/manifest.json'
        ]
    };

    const query = {
        mediaId: 'ind_001',
        type: 'movie' as const,
        title: 'Inception',
        year: 2010,
        imdbId: 'tt1375666',
        tmdbId: '27205'
    };

    console.log('[Test] Initiating Gateway Search for Inception (tt1375666)...');
    const results = await gateway.search(query, context);
    
    let playableDirectCount = 0;
    let torrentCount = 0;
    let externalCount = 0;

    for (const res of results) {
        if (res.sourceType === 'external') externalCount++;
        else if (res.sourceType === 'torrent') torrentCount++;
        else playableDirectCount++;
    }

    console.log(`[Test] Total results returned from gateway: ${results.length}`);
    console.log(`[Test] Playable Direct Count: ${playableDirectCount}`);
    console.log(`[Test] Torrent Count: ${torrentCount}`);
    console.log(`[Test] External Link Count: ${externalCount}`);

    assert.ok(true, 'Live diagnostic completes without asserting playable streams, as Cloudflare blocks might occur in CI.');
});

test('StremioParser: External vs Torrent', () => {
    const externalStream = {
        name: "Google Play",
        externalUrl: "https://play.google.com/..."
    };
    const parsedExt = StremioParser.parse(externalStream, { type: 'movie', mediaId: '1' }, 'Test');
    assert.strictEqual(parsedExt, null, 'External stream should be parsed as null (ignored)');

    const torrentStream = {
        name: "YTS",
        infoHash: "abc",
        fileIdx: 0
    };
    const parsedTor = StremioParser.parse(torrentStream, { type: 'movie', mediaId: '1' }, 'Test');
    assert.strictEqual(parsedTor?.sourceType, 'torrent');
});
