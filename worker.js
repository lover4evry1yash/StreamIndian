import { Router } from 'itty-router'
import { handleCatalogMovies } from './src/catalog/movies.js'
import { handleCatalogSeries } from './src/catalog/series.js'
import { handleMetaMovie } from './src/meta/movie.js'
import { handleMetaSeries } from './src/meta/series.js'
import { handleMetaSeason } from './src/meta/season.js'
import { handleMetaEpisode } from './src/meta/episode.js'
import { handleStream } from './src/streams/torrent.js'
import { handleAIHome } from './src/ai/homescreen.js'
import { handleAISearch } from './src/ai/search.js'
import { json } from './src/utils/response.js'


const router = Router()

router.options('*', () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
)


router.get('/manifest.json', () =>
  json({
    id: 'org.streamindian',
    version: '2.0.0',
    name: 'StreamIndian',
    description: 'Premium Indian OTT-style Stremio addon',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    catalogs: [
      {
        type: 'movie',
        id: 'streamindian.movies',
        name: 'Movies',
        extraSupported: ['skip', 'search']
      },
      {
        type: 'series',
        id: 'streamindian.series',
        name: 'Series',
        extraSupported: ['skip', 'search']
      }
    ]
  })
)


router.get('/catalog/movie/:id.json', handleCatalogMovies)
router.get('/catalog/series/:id.json', handleCatalogSeries)

router.get('/meta/movie/:id.json', handleMetaMovie)
router.get('/meta/series/:id.json', handleMetaSeries)
router.get('/meta/series/:id/season/:season.json', handleMetaSeason)
router.get('/meta/series/:id/season/:season/episode/:episode.json', handleMetaEpisode)

router.get('/stream/:type/:id.json', handleStream)

router.get('/ai/home', handleAIHome)
router.get('/search/:query', handleAISearch)

export default {
  fetch: async (request, env, ctx) => {
    try {
      const response = await router.handle(request, env, ctx)
      if (response) return response
      return new Response('Not Found', { status: 404 })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
