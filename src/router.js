import { json } from './utils/response.js'
import { aiCatalog } from './routes/ai.js'
import { tmdbCatalog } from './routes/tmdb.js'

export async function router(request, env) {
  const url = new URL(request.url)
  const path = url.pathname
  const query = Object.fromEntries(url.searchParams)

  // Stremio manifest
  if (path === '/manifest.json') {
    return json({
      id: 'org.streamindian',
      version: '2.0.0',
      name: 'StreamIndian',
      description: 'AI-powered Indian OTT-style streaming addon',
      resources: ['catalog', 'meta', 'stream'],
      types: ['movie', 'series', 'anime'],
      catalogs: [
        {
          type: 'movie',
          id: 'streamindian-ai',
          name: '🔥 StreamIndian AI',
          extraSupported: ['search', 'skip']
        },
        {
          type: 'series',
          id: 'streamindian-ai',
          name: '🔥 StreamIndian Series',
          extraSupported: ['search', 'skip']
        },
        {
          type: 'anime',
          id: 'streamindian-anime',
          name: '🍥 Anime (JP + EN subs)',
          extraSupported: ['search']
        }
      ]
    })
  }

  // AI home & search
  if (path.startsWith('/catalog/') && path.includes('streamindian-ai')) {
    return aiCatalog({ query }, env)
  }

  // TMDB fallback catalog
  if (path.startsWith('/catalog/')) {
    return tmdbCatalog({ path, query }, env)
  }

  return new Response('Not found', { status: 404 })
}
