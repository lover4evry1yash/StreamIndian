import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Needed if we POST JSON payload
  app.use(express.json());

  // API Route for Gateway Streams (DEVELOPMENT / FALLBACK TRANSPORT)
  app.get('/api/gateway/proxy', async (req, res) => {
    // DO NOT USE THIS ENDPOINT IN PRODUCTION. This is an open proxy for development only.
    

    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });
      if (!targetUrl.match(/\.json$/) && !targetUrl.includes('/stream/') && !targetUrl.includes('/manifest.json')) {
          return res.status(403).json({ error: 'Proxy only allows Stremio addon paths' });
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(targetUrl);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      if (parsedUrl.protocol !== 'https:') {
        return res.status(403).json({ error: 'Only HTTPS is allowed' });
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      // Basic SSRF protection
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || // 172.16.0.0/12
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return res.status(403).json({ error: 'Local and internal addresses are forbidden' });
      }

      const response = await fetch(targetUrl, {
        method: 'GET', // explicitly restrict method
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      res.status(response.status);
      const data = await response.text();
      try {
          res.json(JSON.parse(data));
      } catch(e) {
          res.send(data);
      }
    } catch (e: any) {
      console.error('[Proxy] Error fetching url:', e.message); // don't log full error object to avoid exposing internals
      res.status(500).json({ error: 'Failed to proxy request' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
