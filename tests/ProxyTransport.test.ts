import { test } from 'node:test';
import assert from 'node:assert';
import { ProxyAddonTransport } from '../src/core/streams/gateway/AddonTransport';
import express from 'express';

test('ProxyAddonTransport routes correctly', async () => {
    const app = express();
    app.get('/api/gateway/proxy', (req, res) => {
        res.json({ proxied: req.query.url });
    });
    const server = app.listen(3123);
    
    // Override global fetch to point to our test server
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        const u = new URL(url, 'http://localhost:3123');
        return originalFetch(u.toString(), options);
    };

    const transport = new ProxyAddonTransport();
    const res = await transport.request('https://torrentio.strem.fun/manifest.json');
    const json = await res.json();
    
    global.fetch = originalFetch;
    server.close();

    assert.strictEqual(json.proxied, 'https://torrentio.strem.fun/manifest.json');
});
